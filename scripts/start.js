#!/usr/bin/env node
/**
 * Production start script.
 * Runs Next.js server and BullMQ publish worker in the same process.
 */
const { execSync, spawn } = require("child_process");

// Start Next.js
const next = spawn("npx", ["next", "start"], {
  stdio: "inherit",
  env: process.env,
});

// Start the BullMQ worker if REDIS_URL is set
if (process.env.REDIS_URL) {
  console.log("[start] Starting BullMQ publish worker...");
  const worker = spawn("npx", ["tsx", "src/workers/publish.worker.ts"], {
    stdio: "inherit",
    env: process.env,
  });

  worker.on("error", (err) => {
    console.error("[start] Worker failed to start:", err.message);
  });

  worker.on("exit", (code) => {
    console.error(`[start] Worker exited with code ${code}`);
    // Don't kill the main process — Next.js can still serve
  });
} else {
  console.warn("[start] REDIS_URL not set — publish worker NOT started");
}

next.on("exit", (code) => {
  console.log(`[start] Next.js exited with code ${code}`);
  process.exit(code ?? 1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[start] SIGTERM received, shutting down...");
  next.kill("SIGTERM");
  process.exit(0);
});
