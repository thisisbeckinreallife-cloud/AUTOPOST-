/**
 * Token refresh por plataforma.
 *
 * Cada provider tiene su propio mecanismo:
 *   - Google (YouTube): refresh_token estándar OAuth2, dura indefinidamente
 *   - LinkedIn: refresh_token, ttl ~365 días, requiere re-auth si expira
 *   - TikTok: refresh_token, ttl variable; refresh devuelve nuevo refresh
 *   - Pinterest: refresh_token estándar
 *
 * Llamado desde el worker antes de publicar si:
 *   - connection.expiresAt está a < 5 min del now
 *   - O el primer intento de publish falla con 401
 *
 * Si el refresh también falla, marca el SocialConnection como TOKEN_EXPIRED
 * y la UI mostrará "Reconectar".
 */
import type { SocialPlatform, SocialConnection } from "@prisma/client";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | null;
}

export class TokenRefreshError extends Error {
  readonly platform: SocialPlatform;
  readonly statusCode?: number;
  readonly providerCode?: string;
  constructor(
    platform: SocialPlatform,
    message: string,
    opts: { statusCode?: number; providerCode?: string } = {},
  ) {
    super(message);
    this.name = "TokenRefreshError";
    this.platform = platform;
    this.statusCode = opts.statusCode;
    this.providerCode = opts.providerCode;
  }
}

interface FormParams {
  [key: string]: string;
}

function form(params: FormParams): string {
  return new URLSearchParams(params).toString();
}

async function postForm(url: string, params: FormParams): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form(params),
  });
}

// ─────────────────────────────────────────
// Per-platform refresh
// ─────────────────────────────────────────

async function refreshTikTok(refreshToken: string): Promise<RefreshResult> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new TokenRefreshError("TIKTOK", "TIKTOK_CLIENT_KEY/SECRET missing");
  }

  const res = await postForm("https://open.tiktokapis.com/v2/oauth/token/", {
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const body = await res.text();
  if (!res.ok) {
    throw new TokenRefreshError(
      "TIKTOK",
      `TikTok refresh ${res.status}: ${body.slice(0, 200)}`,
      { statusCode: res.status },
    );
  }

  const data = JSON.parse(body) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
  };
}

async function refreshLinkedIn(refreshToken: string): Promise<RefreshResult> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new TokenRefreshError("LINKEDIN", "LINKEDIN_CLIENT_ID/SECRET missing");
  }

  const res = await postForm("https://www.linkedin.com/oauth/v2/accessToken", {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const body = await res.text();
  if (!res.ok) {
    throw new TokenRefreshError(
      "LINKEDIN",
      `LinkedIn refresh ${res.status}: ${body.slice(0, 200)}`,
      { statusCode: res.status },
    );
  }

  const data = JSON.parse(body) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
  };
}

async function refreshYouTube(refreshToken: string): Promise<RefreshResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new TokenRefreshError("YOUTUBE", "GOOGLE_CLIENT_ID/SECRET missing");
  }

  const res = await postForm("https://oauth2.googleapis.com/token", {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const body = await res.text();
  if (!res.ok) {
    throw new TokenRefreshError(
      "YOUTUBE",
      `Google refresh ${res.status}: ${body.slice(0, 200)}`,
      { statusCode: res.status },
    );
  }

  const data = JSON.parse(body) as {
    access_token: string;
    expires_in?: number;
    // Google no rota refresh tokens en respuesta normal
  };

  return {
    accessToken: data.access_token,
    refreshToken: undefined, // mantenemos el existente
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
  };
}

async function refreshPinterest(refreshToken: string): Promise<RefreshResult> {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new TokenRefreshError("PINTEREST", "PINTEREST_CLIENT_ID/SECRET missing");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new TokenRefreshError(
      "PINTEREST",
      `Pinterest refresh ${res.status}: ${body.slice(0, 200)}`,
      { statusCode: res.status },
    );
  }

  const data = JSON.parse(body) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null,
  };
}

// ─────────────────────────────────────────
// Public API
// ─────────────────────────────────────────

/**
 * Refresca tokens de una conexión y persiste el resultado en DB.
 * Usa los tokens encrypted del SocialConnection y los reescribe.
 */
export async function refreshConnectionTokens(
  connection: SocialConnection,
): Promise<{ accessToken: string }> {
  if (!connection.refreshTokenEnc || !connection.refreshTokenIv || !connection.refreshTokenTag) {
    throw new TokenRefreshError(
      connection.platform,
      "No hay refresh_token guardado para esta conexión. El usuario debe reconectar.",
    );
  }

  const refreshToken = decrypt({
    enc: connection.refreshTokenEnc,
    iv: connection.refreshTokenIv,
    tag: connection.refreshTokenTag,
  });

  let result: RefreshResult;
  try {
    switch (connection.platform) {
      case "TIKTOK":
        result = await refreshTikTok(refreshToken);
        break;
      case "LINKEDIN":
        result = await refreshLinkedIn(refreshToken);
        break;
      case "YOUTUBE":
        result = await refreshYouTube(refreshToken);
        break;
      case "PINTEREST":
        result = await refreshPinterest(refreshToken);
        break;
      default:
        throw new TokenRefreshError(
          connection.platform,
          `Refresh no implementado para ${connection.platform}`,
        );
    }
  } catch (err) {
    // Si falla el refresh, marcamos la conexión como expirada
    await db.socialConnection
      .update({
        where: { id: connection.id },
        data: {
          status: "TOKEN_EXPIRED",
          lastError: err instanceof Error ? err.message : String(err),
          lastCheckedAt: new Date(),
        },
      })
      .catch(() => {});
    throw err;
  }

  // Encriptar y persistir
  const accessEnc = encrypt(result.accessToken);
  const refreshEnc = result.refreshToken ? encrypt(result.refreshToken) : null;

  await db.socialConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: accessEnc.enc,
      accessTokenIv: accessEnc.iv,
      accessTokenTag: accessEnc.tag,
      ...(refreshEnc && {
        refreshTokenEnc: refreshEnc.enc,
        refreshTokenIv: refreshEnc.iv,
        refreshTokenTag: refreshEnc.tag,
      }),
      expiresAt: result.expiresAt,
      status: "ACTIVE",
      lastError: null,
      lastCheckedAt: new Date(),
    },
  });

  return { accessToken: result.accessToken };
}

/**
 * Devuelve un access token válido para esta conexión.
 * Si está cerca de expirar (5 min), refresca primero.
 * Si no hay refresh_token y está expirado, throw.
 */
export async function getValidAccessToken(
  connection: SocialConnection,
): Promise<string> {
  const REFRESH_BEFORE_MS = 5 * 60 * 1000;
  const expiresAt = connection.expiresAt;
  const needsRefresh =
    expiresAt && expiresAt.getTime() < Date.now() + REFRESH_BEFORE_MS;

  if (needsRefresh) {
    const { accessToken } = await refreshConnectionTokens(connection);
    return accessToken;
  }

  // Devolver el access token actual decryptado
  return decrypt({
    enc: connection.accessTokenEnc,
    iv: connection.accessTokenIv,
    tag: connection.accessTokenTag,
  });
}
