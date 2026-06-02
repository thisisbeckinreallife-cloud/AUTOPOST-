/**
 * /api/cron/refresh-meta-tokens
 *
 * GET → endpoint para cron job externo (cron-job.org, GitHub Actions cron,
 *       Vercel Cron, etc.) que refresca proactivamente los long-lived
 *       tokens de Instagram antes de que expiren.
 *
 * Protección: requiere header `Authorization: Bearer ${CRON_SECRET}`.
 * Si no hay CRON_SECRET configurado, el endpoint devuelve 503 (deshabilitado).
 *
 * Recorre todas las MetaConnection con tokenExpiresAt < 30 días, intenta
 * refresh para cada una. Devuelve resumen con cuántas se refrescaron.
 *
 * Recomendado ejecutar 1×/día. La acción es idempotente — si un token
 * no necesita refresh, se salta.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { refreshMetaToken, shouldRefresh } from "@/lib/social/meta/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado en el entorno." },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const startedAt = Date.now();
  const candidates = await db.metaConnection.findMany({
    where: {
      status: "ACTIVE",
      tokenExpiresAt: {
        not: null,
        lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // < 30 días
      },
    },
  });

  const results = {
    total: candidates.length,
    refreshed: 0,
    skipped: 0,
    failed: 0,
    errors: [] as Array<{ connectionId: string; error: string }>,
  };

  for (const conn of candidates) {
    if (!shouldRefresh(conn)) {
      results.skipped += 1;
      continue;
    }
    const result = await refreshMetaToken(conn);
    if (result.refreshed) {
      results.refreshed += 1;
    } else {
      results.failed += 1;
      if (result.error) {
        results.errors.push({ connectionId: conn.id, error: result.error });
      }
    }
  }

  console.log(
    `[Cron refresh-meta-tokens] ${results.refreshed}/${results.total} refrescados en ${Date.now() - startedAt}ms`,
  );
  return NextResponse.json({ ok: true, durationMs: Date.now() - startedAt, ...results });
}
