/**
 * Next.js Instrumentation Hook
 * Starts the BullMQ publish worker alongside the Next.js server.
 * This runs once when the server starts (not on every request).
 */
export async function register() {
  // Only start the worker on the server side (not during build or edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] register() called, runtime=nodejs");

    try {
      const { isRedisAvailable, pingRedis } = await import("@/lib/redis");

      if (!isRedisAvailable()) {
        console.warn(
          "[Instrumentation] REDIS_URL not set — publish worker NOT started. Posts will not be published."
        );
        return;
      }

      // Probe Redis before starting worker. If REDIS_URL points to an
      // unreachable host (e.g. localhost:6379 in dev without Redis), skip
      // the worker to avoid console spam.
      const reachable = await pingRedis();
      if (!reachable) {
        console.warn(
          "[Instrumentation] REDIS_URL is set but Redis is not reachable. Worker NOT started. Set up Redis or unset REDIS_URL."
        );
        return;
      }

      // Dynamically import the worker — this starts it as a side effect
      await import("@/workers/publish.worker");
      console.log("[Instrumentation] BullMQ publish worker started successfully");
    } catch (err) {
      console.error("[Instrumentation] Failed to start worker:", err);
    }
  } else {
    console.log(`[Instrumentation] register() called, runtime=${process.env.NEXT_RUNTIME ?? "unknown"} — skipping worker`);
  }
}
