/**
 * GET /api/healthz
 *
 * Endpoint minimal de health check para Railway. Diferente de /api/health
 * (que es detallado para la página Settings).
 *
 * Propósito: que Railway pueda verificar si el container está vivo.
 * - 200 OK si app responde + DB ping en <2s
 * - 503 si DB no responde
 *
 * Configurado en railway.toml#deploy.healthcheckPath. Si Railway recibe 503
 * varias veces seguidas, mata el container y reinicia (failover automático).
 *
 * NO expone info sensible: solo "ok" + timestamp + status DB.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Timeout corto: si DB no responde en 2s, fallar el healthcheck.
const DB_PING_TIMEOUT_MS = 2000;

export async function GET() {
  const startedAt = Date.now();

  let dbOk = false;
  let dbError: string | undefined;

  try {
    // Race: ping vs timeout. Sin timeout, una DB lenta cuelga el healthcheck.
    await Promise.race([
      db.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db_ping_timeout")), DB_PING_TIMEOUT_MS)
      ),
    ]);
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "unknown";
  }

  const elapsedMs = Date.now() - startedAt;
  const ok = dbOk;

  return NextResponse.json(
    {
      ok,
      service: "autopost",
      timestamp: new Date().toISOString(),
      checks: {
        db: dbOk ? "ok" : `fail: ${dbError ?? "unknown"}`,
      },
      elapsedMs,
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
