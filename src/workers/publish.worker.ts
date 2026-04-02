/**
 * BullMQ publish worker.
 * Run separately from Next.js: `npm run worker`
 *
 * Responsibilities:
 *  1. Receive publish job from queue
 *  2. Acquire optimistic lock (prevent double-publish)
 *  3. Fetch PostDraft + assets + MetaConnection
 *  4. Call Meta API publisher
 *  5. Record result in DB
 *  6. Release lock
 */
import { Worker, Job } from "bullmq";
import { createBullMQConnection } from "@/lib/redis";
import { db } from "@/lib/db";
import { publishPost } from "@/services/meta/publisher";
import { PUBLISH_QUEUE_NAME } from "@/services/scheduler/queue";
import type { PublishJobPayload } from "@/types";
import { MetaApiError } from "@/services/meta/client";

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? "3", 10);
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

async function processPublishJob(job: Job<PublishJobPayload>): Promise<void> {
  const { postDraftId, publishJobId, businessId } = job.data;
  const attemptNumber = (job.attemptsMade ?? 0) + 1;

  console.log(
    `[Worker] Processing job ${job.id} | postDraft=${postDraftId} | attempt=${attemptNumber}`
  );

  // ─── 1. Fetch entities ───
  const [draft, publishJob] = await Promise.all([
    db.postDraft.findUnique({
      where: { id: postDraftId },
      include: { mediaAssets: true },
    }),
    db.publishJob.findUnique({ where: { id: publishJobId } }),
  ]);

  if (!draft) throw new Error(`PostDraft ${postDraftId} not found`);
  if (!publishJob) throw new Error(`PublishJob ${publishJobId} not found`);

  // ─── 2. Idempotency check — already published ───
  if (draft.status === "PUBLISHED") {
    console.log(`[Worker] PostDraft ${postDraftId} already published, skipping`);
    return;
  }

  if (draft.status === "CANCELLED") {
    console.log(`[Worker] PostDraft ${postDraftId} cancelled, skipping`);
    return;
  }

  // ─── 3. Optimistic lock — prevent double publish ───
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LOCK_DURATION_MS);

  const locked = await db.publishJob.updateMany({
    where: {
      id: publishJobId,
      OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      status: { notIn: ["COMPLETED", "CANCELLED"] },
    },
    data: { lockedUntil: lockUntil, status: "RUNNING", startedAt: now },
  });

  if (locked.count === 0) {
    console.warn(`[Worker] Job ${publishJobId} is locked by another process, skipping`);
    return;
  }

  // ─── 4. Create attempt record ───
  const attempt = await db.publishAttempt.create({
    data: {
      publishJobId,
      attemptNumber,
      startedAt: now,
    },
  });

  // Mark draft as publishing
  await db.postDraft.update({
    where: { id: postDraftId },
    data: { status: "PUBLISHING", attemptCount: { increment: 1 } },
  });

  try {
    // ─── 5. Get Meta connection ───
    const connection = await db.metaConnection.findUnique({
      where: { businessId },
    });

    if (!connection) {
      throw new Error(`No MetaConnection found for business ${businessId}`);
    }

    if (connection.status !== "ACTIVE") {
      throw new Error(
        `MetaConnection status is "${connection.status}". Token may be expired.`
      );
    }

    // ─── 6. Publish ───
    const result = await publishPost(draft, connection);

    // ─── 7. Record success ───
    const finishedAt = new Date();

    await db.$transaction([
      db.postDraft.update({
        where: { id: postDraftId },
        data: {
          status: "PUBLISHED",
          publishedAt: finishedAt,
          metaContainerId: result.containerId,
          metaPublicationId: result.mediaId,
          metaPermalink: result.permalink,
          lastMetaResponse: {
            mediaId: result.mediaId,
            containerId: result.containerId,
            permalink: result.permalink,
          },
          lastError: null,
        },
      }),
      db.publishJob.update({
        where: { id: publishJobId },
        data: {
          status: "COMPLETED",
          finishedAt,
          lockedUntil: null,
        },
      }),
      db.publishAttempt.update({
        where: { id: attempt.id },
        data: {
          finishedAt,
          success: true,
          metaResponse: {
            mediaId: result.mediaId,
            containerId: result.containerId,
            permalink: result.permalink,
          },
        },
      }),
      db.auditLog.create({
        data: {
          businessId,
          action: "POST_PUBLISHED",
          entityType: "PostDraft",
          entityId: postDraftId,
          detail: { mediaId: result.mediaId, permalink: result.permalink },
        },
      }),
    ]);

    console.log(
      `[Worker] Published post ${postDraftId} → mediaId=${result.mediaId}`
    );
  } catch (error) {
    const err = error as Error;
    const finishedAt = new Date();
    const isMetaError = err instanceof MetaApiError;

    const errorCode = isMetaError ? String((err as MetaApiError).code) : undefined;
    const errorMessage = err.message;

    const isLastAttempt = attemptNumber >= (job.opts.attempts ?? 3);
    const finalStatus = isLastAttempt ? "FAILED" : "SCHEDULED"; // will be retried

    await db.$transaction([
      db.postDraft.update({
        where: { id: postDraftId },
        data: {
          status: isLastAttempt ? "FAILED" : "SCHEDULED",
          failedAt: isLastAttempt ? finishedAt : undefined,
          lastError: errorMessage,
          lastMetaResponse: isMetaError
            ? {
                errorCode: (err as MetaApiError).code,
                errorMessage,
                type: (err as MetaApiError).type,
              }
            : { errorMessage },
        },
      }),
      db.publishJob.update({
        where: { id: publishJobId },
        data: {
          status: isLastAttempt ? "FAILED" : "PENDING",
          finishedAt: isLastAttempt ? finishedAt : undefined,
          lockedUntil: null,
        },
      }),
      db.publishAttempt.update({
        where: { id: attempt.id },
        data: {
          finishedAt,
          success: false,
          errorCode,
          errorMessage,
        },
      }),
      db.auditLog.create({
        data: {
          businessId,
          action: isLastAttempt ? "POST_PUBLISH_FAILED" : "POST_PUBLISH_ATTEMPT_FAILED",
          entityType: "PostDraft",
          entityId: postDraftId,
          detail: { errorMessage, attemptNumber, isLastAttempt },
        },
      }),
    ]);

    console.error(
      `[Worker] Publish failed for ${postDraftId} (attempt ${attemptNumber}/${job.opts.attempts ?? 3}): ${errorMessage}`
    );

    // Re-throw so BullMQ handles retry logic
    throw error;
  }
}

// ─────────────────────────────────────────
// WORKER SETUP
// ─────────────────────────────────────────

const worker = new Worker<PublishJobPayload>(
  PUBLISH_QUEUE_NAME,
  processPublishJob,
  {
    connection: createBullMQConnection(),
    concurrency: CONCURRENCY,
    autorun: true,
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[Worker] Worker error:", err);
});

console.log(
  `[Worker] Started. Queue: ${PUBLISH_QUEUE_NAME} | Concurrency: ${CONCURRENCY}`
);

// Graceful shutdown — only register if running standalone (not inside Next.js)
const isStandalone = !process.env.NEXT_RUNTIME;
if (isStandalone) {
  process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM received, closing worker...");
    await worker.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Worker] SIGINT received, closing worker...");
    await worker.close();
    process.exit(0);
  });
}

export { worker };
