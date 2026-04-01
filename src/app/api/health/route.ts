/**
 * GET /api/health
 * Returns the status of all required configuration WITHOUT exposing values.
 * Used by the Settings page to show exactly what is missing.
 */
import { NextResponse } from "next/server";

function checkEncryptionKey(): { ok: boolean; detail: string } {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return { ok: false, detail: "No está configurada (ENCRYPTION_KEY vacía)" };
  if (key.length !== 64) return { ok: false, detail: `Tiene ${key.length} caracteres (debe tener exactamente 64)` };
  if (!/^[0-9a-fA-F]+$/.test(key)) return { ok: false, detail: "Contiene caracteres inválidos (solo letras a-f y números)" };
  return { ok: true, detail: "OK" };
}

async function checkDatabase(): Promise<{ ok: boolean; detail: string }> {
  try {
    const { db } = await import("@/lib/db");
    await db.$queryRaw`SELECT 1`;
    return { ok: true, detail: "OK" };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message.slice(0, 100) : "Error de conexión" };
  }
}

async function checkMetaConfig(): Promise<{ ok: boolean; detail: string }> {
  try {
    const { getConfigStatus } = await import("@/lib/config");
    const status = await getConfigStatus();
    const missing = Object.entries(status).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length > 0) return { ok: false, detail: `Faltan: ${missing.join(", ")}` };
    return { ok: true, detail: "App ID, Secret y URL configurados" };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message.slice(0, 100) : "Error leyendo configuración" };
  }
}

export async function GET() {
  const [encKey, db, meta] = await Promise.all([
    Promise.resolve(checkEncryptionKey()),
    checkDatabase(),
    checkMetaConfig(),
  ]);

  const allOk = encKey.ok && db.ok && meta.ok;

  return NextResponse.json({
    ok: allOk,
    checks: {
      encryption_key: encKey,
      database: db,
      meta_credentials: meta,
    },
  }, { status: allOk ? 200 : 500 });
}
