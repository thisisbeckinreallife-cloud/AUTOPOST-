import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL;
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
