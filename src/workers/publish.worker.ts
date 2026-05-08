/**
 * BullMQ publish worker.
 * Run separately from Next.js: `npm run worker`
 *
 * Procesa dos colas:
 *  1. PUBLISH_QUEUE_NAME — Meta legacy (IG + FB) → publishPost(meta)
 *  2. SOCIAL_PUBLISH_QUEUE_NAME — TikTok / LinkedIn / YT / Pinterest → adapter dispatch
 *
 * Responsibilities:
 *  1. Receive publish job from queue
 *  2. Acquire optimistic lock (prevent double-publish)
 *  3. Fetch PostDraft + assets + connection
 *  4. Call platform adapter
 *  5. Record result in DB
 *  6. Release lock
 */
import { Worker, Job } from "bullmq";
import { createBullMQConnection } from "@/lib/redis";
import { db } from "@/lib/db";
import { publishPost } from "@/services/meta/publisher";
import {
  PUBLISH_QUEUE_NAME,
  SOCIAL_PUBLISH_QUEUE_NAME,
} from "@/services/scheduler/queue";
import type { PublishJobPayload, SocialPublishJobPayload } from "@/types";
import { MetaApiError } from "@/services/meta/client";
import { sendEmail, publishedEmailHtml, failedEmailHtml } from "@/lib/email";
import { dispatchPublish, PlatformPublishError } from "@/lib/social/adapters";
import { getValidAccessToken } from "@/lib/social/oauth/refresh";
import { appendWatermark } from "@/lib/billing/watermark";

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
    throw new Error(`Job ${publishJobId} is locked by another process — will retry`);
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

    // ─── 5b. Watermark "Programado con autopost.app" si plan FREE/BASIC ───
    // Single-tenant actual: el owner es el único AdminUser de la instancia.
    // Subscription incluido para honrar plan vigente cuando el webhook de
    // Stripe llega tarde y AdminUser.plan está desactualizado.
    const owner = await db.adminUser.findFirst({
      include: { subscription: true },
    });

    if (owner) {
      const watermarkedCaption = appendWatermark(draft.caption, owner, owner.subscription);
      if (watermarkedCaption !== draft.caption) {
        console.log(`[Worker] Watermark añadido (plan=${owner.plan} hideWatermark=${owner.hideWatermark})`);
        draft.caption = watermarkedCaption;
      }
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

    // Fire-and-forget email notification
    const notifyEmail = process.env.NOTIFY_EMAIL;
    if (notifyEmail) {
      const business = await db.business.findUnique({ where: { id: businessId }, select: { name: true } });
      sendEmail(
        notifyEmail,
        `✅ Post publicado — ${business?.name ?? businessId}`,
        publishedEmailHtml({
          businessName: business?.name ?? businessId,
          captionExcerpt: draft.caption.slice(0, 120) + (draft.caption.length > 120 ? "…" : ""),
          permalink: result.permalink,
          publishedAt: finishedAt.toLocaleString("es-ES"),
        })
      ).catch(() => {}); // explicitly fire-and-forget
    }
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

    // Fire-and-forget email on final failure only
    if (isLastAttempt) {
      const notifyEmail = process.env.NOTIFY_EMAIL;
      if (notifyEmail) {
        const business = await db.business.findUnique({ where: { id: businessId }, select: { name: true } });
        sendEmail(
          notifyEmail,
          `❌ Fallo al publicar — ${business?.name ?? businessId}`,
          failedEmailHtml({
            businessName: business?.name ?? businessId,
            captionExcerpt: draft.caption.slice(0, 120) + (draft.caption.length > 120 ? "…" : ""),
            errorMessage,
            scheduledFor: draft.publishAt.toLocaleString("es-ES"),
          })
        ).catch(() => {}); // fire-and-forget
      }
    }

    // Re-throw so BullMQ handles retry logic
    throw error;
  }
}

// ─────────────────────────────────────────
// SOCIAL PUBLISH JOB (TikTok / LinkedIn / YT / Pinterest)
// ─────────────────────────────────────────

async function processSocialPublishJob(
  job: Job<SocialPublishJobPayload>,
): Promise<void> {
  const { socialPublicationId } = job.data;
  const attemptNumber = (job.attemptsMade ?? 0) + 1;

  console.log(
    `[Worker] Social publish job ${job.id} | publication=${socialPublicationId} | attempt=${attemptNumber}`,
  );

  // Cargar publicación + draft + assets + connection
  const publication = await db.socialPublication.findUnique({
    where: { id: socialPublicationId },
    include: {
      postDraft: { include: { mediaAssets: true } },
      connection: true,
    },
  });

  if (!publication) {
    throw new Error(`SocialPublication ${socialPublicationId} not found`);
  }

  // Idempotencia
  if (publication.status === "PUBLISHED") {
    console.log(`[Worker] Publication ${socialPublicationId} already published`);
    return;
  }

  if (publication.connection.status !== "ACTIVE") {
    await db.socialPublication.update({
      where: { id: socialPublicationId },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        errorMessage: `Connection status is ${publication.connection.status}. User must reconnect.`,
      },
    });
    return; // No retry — el user debe reconectar
  }

  // Mark as publishing
  await db.socialPublication.update({
    where: { id: socialPublicationId },
    data: { status: "PUBLISHING" },
  });

  try {
    // Refresca el token si está cerca de expirar
    const accessToken = await getValidAccessToken(publication.connection);

    // Watermark "Programado con autopost.app" si plan FREE/BASIC.
    const owner = await db.adminUser.findFirst({ include: { subscription: true } });
    if (owner) {
      const watermarkedCaption = appendWatermark(
        publication.postDraft.caption,
        owner,
        owner.subscription,
      );
      if (watermarkedCaption !== publication.postDraft.caption) {
        console.log(`[Worker] Watermark añadido (plan=${owner.plan} platform=${publication.platform})`);
        publication.postDraft.caption = watermarkedCaption;
      }
    }

    const result = await dispatchPublish(publication.platform, {
      draft: publication.postDraft,
      accessToken,
      connection: publication.connection,
    });

    await db.$transaction([
      db.socialPublication.update({
        where: { id: socialPublicationId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          externalPostId: result.externalPostId,
          externalPermalink: result.externalPermalink,
          errorMessage: null,
        },
      }),
      db.auditLog.create({
        data: {
          businessId: publication.connection.businessId,
          action: "SOCIAL_POST_PUBLISHED",
          entityType: "SocialPublication",
          entityId: socialPublicationId,
          detail: {
            platform: publication.platform,
            externalPostId: result.externalPostId,
            permalink: result.externalPermalink,
          },
        },
      }),
    ]);

    console.log(
      `[Worker] ${publication.platform} published → ${result.externalPostId}`,
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isPlatformErr = err instanceof PlatformPublishError;
    const retryable = isPlatformErr ? err.retryable : true;
    const maxAttempts = job.opts.attempts ?? 3;
    const isLastAttempt = attemptNumber >= maxAttempts || !retryable;

    await db.socialPublication.update({
      where: { id: socialPublicationId },
      data: {
        status: isLastAttempt ? "FAILED" : "PENDING",
        failedAt: isLastAttempt ? new Date() : undefined,
        errorMessage,
      },
    });

    await db.auditLog
      .create({
        data: {
          businessId: publication.connection.businessId,
          action: isLastAttempt
            ? "SOCIAL_POST_PUBLISH_FAILED"
            : "SOCIAL_POST_PUBLISH_ATTEMPT_FAILED",
          entityType: "SocialPublication",
          entityId: socialPublicationId,
          detail: {
            platform: publication.platform,
            errorMessage,
            attemptNumber,
            retryable,
          },
        },
      })
      .catch(() => {});

    console.error(
      `[Worker] ${publication.platform} publish failed (attempt ${attemptNumber}/${maxAttempts}): ${errorMessage}`,
    );

    // Si no es retryable, no relanzamos — BullMQ no reintenta más
    if (!retryable) return;

    throw err;
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

const socialWorker = new Worker<SocialPublishJobPayload>(
  SOCIAL_PUBLISH_QUEUE_NAME,
  processSocialPublishJob,
  {
    connection: createBullMQConnection(),
    concurrency: CONCURRENCY,
    autorun: true,
  },
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message, err.stack);
});

worker.on("error", (err) => {
  console.error("[Worker] Worker error:", err);
});

socialWorker.on("completed", (job) => {
  console.log(`[Worker:social] Job ${job.id} completed`);
});

socialWorker.on("failed", (job, err) => {
  console.error(`[Worker:social] Job ${job?.id} failed:`, err.message);
});

socialWorker.on("error", (err) => {
  console.error("[Worker:social] Worker error:", err);
});

console.log(
  `[Worker] Started. Queues: ${PUBLISH_QUEUE_NAME} + ${SOCIAL_PUBLISH_QUEUE_NAME} | Concurrency: ${CONCURRENCY}`,
);

// ─────────────────────────────────────────
// CLEANUP TASK — borrar AiChats sin actividad > 3h
// Corre cada hora. Mantiene la DB ligera y previene fuga de info de
// conversaciones abandonadas. Los AiChatMessage se borran en cascada.
// ─────────────────────────────────────────
const CHAT_TTL_MS = 3 * 60 * 60 * 1000; // 3 horas
const CHAT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // cada hora

async function cleanupStaleChats(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - CHAT_TTL_MS);
    const result = await db.aiChat.deleteMany({
      where: { updatedAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      console.log(`[ChatCleanup] Borrados ${result.count} chats sin actividad >3h`);
    }
  } catch (err) {
    console.error("[ChatCleanup] error:", err);
  }
}

// Primera ejecución a los 5 min de arrancar el worker (no inmediata para
// dar tiempo a que el deploy se estabilice). Después cada hora.
setTimeout(() => {
  cleanupStaleChats();
  setInterval(cleanupStaleChats, CHAT_CLEANUP_INTERVAL_MS);
}, 5 * 60 * 1000);

// Graceful shutdown — only register if running standalone (not inside Next.js)
const isStandalone = !process.env.NEXT_RUNTIME;
if (isStandalone) {
  process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM received, closing workers...");
    await Promise.all([worker.close(), socialWorker.close()]);
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("[Worker] SIGINT received, closing workers...");
    await Promise.all([worker.close(), socialWorker.close()]);
    process.exit(0);
  });
}

export { worker, socialWorker };
