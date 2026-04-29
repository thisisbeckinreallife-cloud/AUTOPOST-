#!/usr/bin/env node
/**
 * Production start script.
 * Runs Next.js server and BullMQ publish worker in the same process.
 *
 * Modo standalone (next.config.mjs `output: 'standalone'`):
 *   - .next/standalone/server.js es el entry point
 *   - .next/standalone tiene sus propios node_modules (sólo deps usadas)
 *   - public/ y .next/static/ se copian aparte (ver railway.toml)
 *
 * Fallback al modo clásico si el standalone build no existe (dev local).
 *
 * Set DISABLE_WORKER=1 to skip the worker.
 */
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("[start] Boot — node", process.version, "PORT=", process.env.PORT ?? "<unset>");

// Detectar standalone output
const standaloneServer = path.resolve(__dirname, "..", ".next", "standalone", "server.js");
const useStandalone = fs.existsSync(standaloneServer);

let next;
if (useStandalone) {
  console.log("[start] Standalone mode →", standaloneServer);
  next = spawn("node", [standaloneServer], {
    stdio: "inherit",
    env: process.env,
  });
} else {
  console.log("[start] Classic mode (npx next start)");
  next = spawn("npx", ["next", "start"], {
    stdio: "inherit",
    env: process.env,
  });
}

// Start the BullMQ worker unless explicitly disabled
const workerDisabled = process.env.DISABLE_WORKER === "1";
if (workerDisabled) {
  console.warn("[start] DISABLE_WORKER=1 — publish worker NOT started");
} else if (process.env.REDIS_URL) {
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
