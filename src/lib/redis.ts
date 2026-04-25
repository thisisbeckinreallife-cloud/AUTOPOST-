import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Probe Redis with a short timeout to detect stale REDIS_URL (e.g. localhost
 * with no Redis running in dev). Returns true only if PING succeeds within
 * the timeout. Avoids the worker spamming ECONNREFUSED.
 */
export async function pingRedis(timeoutMs = 1500): Promise<boolean> {
  const url = process.env.REDIS_URL;
  if (!url) return false;
  const probe = new Redis(url, {
    maxRetriesPerRequest: 0,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: timeoutMs,
  });
  try {
    const result = await Promise.race([
      probe.ping(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    return result === "PONG";
  } catch {
    return false;
  } finally {
    probe.disconnect();
  }
}

function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set. Background job queue is disabled.");

  const client = new Redis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    console.error("[Redis] Error:", err.message);
  });

  return client;
}

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (global.__redis) return global.__redis;
  const client = createRedisClient();
  if (process.env.NODE_ENV !== "production") global.__redis = client;
  return client;
}

// Separate connection factory for BullMQ (needs dedicated connections)
export function createBullMQConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
