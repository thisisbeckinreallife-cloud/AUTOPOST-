/**
 * BullMQ queue definitions and job scheduling.
 * Dos colas:
 *   - PUBLISH_QUEUE_NAME ("instagram-publish") — Meta API legacy (IG + FB)
 *   - SOCIAL_PUBLISH_QUEUE_NAME ("social-publish") — TikTok / LinkedIn / YT / Pinterest
 *
 * Ambas corren en el mismo worker process pero con handlers distintos.
 */
import { Queue, QueueEvents } from "bullmq";
import { createBullMQConnection, isRedisAvailable } from "@/lib/redis";
import type { PublishJobPayload, SocialPublishJobPayload } from "@/types";

export const PUBLISH_QUEUE_NAME = "instagram-publish";
export const SOCIAL_PUBLISH_QUEUE_NAME = "social-publish";

let _publishQueue: Queue<PublishJobPayload> | null = null;
let _socialPublishQueue: Queue<SocialPublishJobPayload> | null = null;

export function getPublishQueue(): Queue<PublishJobPayload> {
  if (!isRedisAvailable()) {
    throw new Error("Redis is not configured. Background job scheduling requires REDIS_URL.");
  }
  if (!_publishQueue) {
    _publishQueue = new Queue<PublishJobPayload>(PUBLISH_QUEUE_NAME, {
      connection: createBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60_000, // 1 min, then 2 min, then 4 min
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _publishQueue;
}

export function getSocialPublishQueue(): Queue<SocialPublishJobPayload> {
  if (!isRedisAvailable()) {
    throw new Error("Redis is not configured. Background job scheduling requires REDIS_URL.");
  }
  if (!_socialPublishQueue) {
    _socialPublishQueue = new Queue<SocialPublishJobPayload>(SOCIAL_PUBLISH_QUEUE_NAME, {
      connection: createBullMQConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60_000,
        },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 500 },
      },
    });
  }
  return _socialPublishQueue;
}

/**
 * Schedule un job de publicación social (no-Meta).
 */
export async function scheduleSocialPublishJob(
  socialPublicationId: string,
  publishAt: Date,
): Promise<string> {
  const queue = getSocialPublishQueue();
  const now = Date.now();
  const delay = Math.max(0, publishAt.getTime() - now);

  const jobId = `social-publish-${socialPublicationId}`;

  const payload: SocialPublishJobPayload = {
    socialPublicationId,
    attempt: 1,
  };

  const job = await queue.add("social-publish", payload, {
    jobId,
    delay,
  });

  return job.id ?? jobId;
}

/**
 * Cancel a pending social publish job.
 */
export async function cancelSocialPublishJob(bullmqJobId: string): Promise<void> {
  const queue = getSocialPublishQueue();
  const job = await queue.getJob(bullmqJobId);
  if (job) {
    await job.remove();
  }
}

/**
 * Schedule a publish job for a specific time.
 * Uses BullMQ delayed jobs — delay is from NOW until publish_at.
 * Idempotency: BullMQ jobId ensures no duplicate jobs.
 */
export async function schedulePublishJob(
  postDraftId: string,
  publishJobId: string,
  businessId: string,
  publishAt: Date
): Promise<string> {
  const queue = getPublishQueue();
  const now = Date.now();
  const delay = Math.max(0, publishAt.getTime() - now);

  const jobId = `publish-${publishJobId}`;

  const payload: PublishJobPayload = {
    postDraftId,
    publishJobId,
    businessId,
    attempt: 1,
  };

  const job = await queue.add("publish", payload, {
    jobId, // Idempotency key — BullMQ won't create duplicate if same ID
    delay,
  });

  return job.id ?? jobId;
}

/**
 * Cancel a pending job.
 */
export async function cancelPublishJob(bullmqJobId: string): Promise<void> {
  const queue = getPublishQueue();
  const job = await queue.getJob(bullmqJobId);
  if (job) {
    await job.remove();
  }
}

/**
 * Re-queue a failed job immediately (for manual retry).
 */
export async function retryPublishJobNow(publishJobId: string): Promise<string> {
  const queue = getPublishQueue();
  const jobId = `publish-${publishJobId}`;

  const job = await queue.getJob(jobId);
  if (job) {
    await job.retry("failed");
    return jobId;
  }

  // If job no longer exists, re-create it
  const dbJob = await import("@/lib/db").then(({ db }) =>
    db.publishJob.findUnique({
      where: { id: publishJobId },
      include: { postDraft: true, attempts: true },
    })
  );

  if (!dbJob) throw new Error(`PublishJob ${publishJobId} not found`);

  const newJob = await queue.add(
    "publish",
    {
      postDraftId: dbJob.postDraftId,
      publishJobId: dbJob.id,
      businessId: dbJob.businessId,
      attempt: dbJob.attempts.length + 1,
    } as PublishJobPayload,
    { jobId, delay: 0 }
  );

  return newJob.id ?? jobId;
}
