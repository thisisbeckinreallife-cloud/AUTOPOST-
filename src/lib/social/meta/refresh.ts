/**
 * Meta · Long-lived token auto-refresh
 * ──────────────────────────────────────────────────────────────────────────
 * Los long-lived tokens de Instagram duran ~60 días y se pueden refrescar
 * antes de expirar SIN reautorización del usuario, llamando a:
 *
 *   GET https://graph.instagram.com/refresh_access_token
 *     ?grant_type=ig_refresh_token
 *     &access_token={CURRENT_LONG_LIVED_TOKEN}
 *
 * Devuelve un nuevo token con ~60 días nuevos. La condición es que el
 * token actual TODAVÍA sea válido — si ya expiró, este endpoint falla y
 * el user tiene que hacer OAuth de nuevo manualmente.
 *
 * Por eso conviene refrescar cuando queden ≥7 días antes de expirar, no
 * en el último momento. El plan: lazy refresh en publisher.ts (justo
 * antes de publicar, si <30 días) + cron opcional para cuentas sin
 * actividad reciente.
 */

import type { MetaConnection } from "@prisma/client";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";

const REFRESH_ENDPOINT = "https://graph.instagram.com/refresh_access_token";

export interface RefreshResult {
  refreshed: boolean;
  /** Nuevo tokenExpiresAt si refresh exitoso. */
  expiresAt: Date | null;
  /** Error message si refresh falló (token caducado, app revoked, etc.). */
  error?: string;
}

/**
 * Intenta refrescar el long-lived token de Instagram para una MetaConnection.
 *
 * Si tiene éxito: actualiza accessToken{Enc,Iv,Tag} + tokenExpiresAt + lastError=null
 * + status="ACTIVE" en BD.
 * Si falla (token ya caducado, app revoked, etc.): marca status="TOKEN_EXPIRED"
 * + lastError con el mensaje, y devuelve refreshed=false.
 *
 * NUNCA lanza excepciones — siempre devuelve un RefreshResult. El caller
 * decide qué hacer (publisher continúa con el token viejo si falla, la UI
 * muestra "Reconectar").
 */
export async function refreshMetaToken(connection: MetaConnection): Promise<RefreshResult> {
  try {
    const currentToken = decrypt({
      enc: connection.accessTokenEnc,
      iv: connection.accessTokenIv,
      tag: connection.accessTokenTag,
    });

    const url = new URL(REFRESH_ENDPOINT);
    url.searchParams.set("grant_type", "ig_refresh_token");
    url.searchParams.set("access_token", currentToken);

    const res = await fetch(url.toString(), { method: "GET" });
    const json = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: { code?: number; message?: string };
    };

    if (!res.ok || !json.access_token) {
      const msg = json.error?.message ?? `HTTP ${res.status}`;
      console.warn(`[Meta refresh] Failed for connection ${connection.id}: ${msg}`);
      await db.metaConnection
        .update({
          where: { id: connection.id },
          data: {
            status: "TOKEN_EXPIRED",
            lastError: `Refresh fallido: ${msg}`,
          },
        })
        .catch(() => {});
      return { refreshed: false, expiresAt: null, error: msg };
    }

    const expiresIn = json.expires_in ?? 60 * 24 * 60 * 60; // default 60 días
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const encrypted = encrypt(json.access_token);

    await db.metaConnection.update({
      where: { id: connection.id },
      data: {
        accessTokenEnc: encrypted.enc,
        accessTokenIv: encrypted.iv,
        accessTokenTag: encrypted.tag,
        tokenExpiresAt: expiresAt,
        status: "ACTIVE",
        lastError: null,
      },
    });

    console.log(
      `[Meta refresh] Refrescado connection ${connection.id} → nuevo expira ${expiresAt.toISOString()}`,
    );
    return { refreshed: true, expiresAt };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error(`[Meta refresh] Excepción en connection ${connection.id}:`, err);
    return { refreshed: false, expiresAt: null, error: msg };
  }
}

/**
 * Política: refresca si quedan <30 días para expirar. Margen amplio para
 * cubrir cuentas con poca actividad — si llamamos solo al expirar mañana,
 * y la cuenta lleva 50 días sin actividad, podemos llegar tarde.
 */
export function shouldRefresh(
  connection: Pick<MetaConnection, "tokenExpiresAt" | "status">,
): boolean {
  if (connection.status !== "ACTIVE") return false;
  if (!connection.tokenExpiresAt) return false;
  const msUntilExpiry = connection.tokenExpiresAt.getTime() - Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return msUntilExpiry < THIRTY_DAYS;
}
