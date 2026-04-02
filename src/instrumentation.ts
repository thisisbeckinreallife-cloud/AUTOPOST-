/**
 * Next.js Instrumentation Hook
 * Starts the BullMQ publish worker alongside the Next.js server.
 * This runs once when the server starts (not on every request).
 */
export async function register() {
  // Only start the worker on the server side (not during build or edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { isRedisAvailable } = await import("@/lib/redis");

    if (isRedisAvailable()) {
      // Dynamically import the worker — this starts it as a side effect
      await import("@/workers/publish.worker");
      console.log("[Instrumentation] BullMQ publish worker started");
    } else {
      console.warn(
        "[Instrumentation] Redis not configured — publish worker NOT started. Set REDIS_URL to enable."
      );
    }
  }
}
