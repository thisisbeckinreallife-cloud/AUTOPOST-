/**
 * Exchange OAuth code → access_token para cada plataforma.
 *
 * Cada provider tiene su endpoint y formato de respuesta. Aquí
 * unificamos a una shape común que el callback usa.
 *
 * Devuelve siempre:
 *   { accessToken, refreshToken?, expiresAt?, userId, username, displayName, scopes }
 *
 * Los handlers son skeletons funcionales — para activarlos en producción:
 *   1. Crear app en cada plataforma
 *   2. Configurar redirect URI: https://autopost.../api/social/{platform}/oauth/callback
 *   3. Añadir client_id y client_secret a env vars de Railway
 *   4. Para TikTok: solicitar app review (1-2 sem)
 */
import type { SocialPlatform } from "@prisma/client";

export interface ExchangeInput {
  platform: SocialPlatform;
  code: string;
  redirectUri: string;
}

export interface ExchangeResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  userId: string;
  username?: string;
  displayName?: string;
  scopes: string[];
}

export async function exchangeCodeForToken(
  input: ExchangeInput,
): Promise<ExchangeResult> {
  switch (input.platform) {
    case "TIKTOK":
      return exchangeTikTok(input);
    case "LINKEDIN":
      return exchangeLinkedIn(input);
    case "YOUTUBE":
      return exchangeYouTube(input);
    case "PINTEREST":
      return exchangePinterest(input);
    default:
      throw new Error(`Plataforma desconocida: ${input.platform}`);
  }
}

// ─── TikTok ────────────────────────────────────────────────────────────
async function exchangeTikTok(input: ExchangeInput): Promise<ExchangeResult> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok client_key/secret no configurados");
  }

  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code: input.code,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
  });

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`TikTok token exchange: HTTP ${tokenRes.status}`);
  }
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    open_id?: string;
    error?: string;
  };
  if (!tokenData.access_token || !tokenData.open_id) {
    throw new Error(`TikTok: ${tokenData.error ?? "respuesta inválida"}`);
  }

  // Fetch user info
  let username: string | undefined;
  let displayName: string | undefined;
  try {
    const userRes = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    if (userRes.ok) {
      const userData = (await userRes.json()) as {
        data?: { user?: { username?: string; display_name?: string } };
      };
      username = userData.data?.user?.username;
      displayName = userData.data?.user?.display_name;
    }
  } catch {}

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined,
    userId: tokenData.open_id,
    username,
    displayName,
    scopes: tokenData.scope ? tokenData.scope.split(",") : [],
  };
}

// ─── LinkedIn ──────────────────────────────────────────────────────────
async function exchangeLinkedIn(input: ExchangeInput): Promise<ExchangeResult> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn client_id/secret no configurados");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const tokenRes = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
  );
  if (!tokenRes.ok) {
    throw new Error(`LinkedIn token exchange: HTTP ${tokenRes.status}`);
  }
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    refresh_token?: string;
    error_description?: string;
  };
  if (!tokenData.access_token) {
    throw new Error(`LinkedIn: ${tokenData.error_description ?? "sin token"}`);
  }

  // OpenID Connect userinfo
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  let userId = "unknown";
  let username: string | undefined;
  let displayName: string | undefined;
  if (userRes.ok) {
    const u = (await userRes.json()) as {
      sub?: string;
      name?: string;
      email?: string;
      preferred_username?: string;
    };
    userId = u.sub ?? "unknown";
    displayName = u.name;
    username = u.preferred_username ?? u.email;
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined,
    userId,
    username,
    displayName,
    scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
  };
}

// ─── YouTube (Google) ──────────────────────────────────────────────────
async function exchangeYouTube(input: ExchangeInput): Promise<ExchangeResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client no configurado");
  }

  const params = new URLSearchParams({
    code: input.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange: HTTP ${tokenRes.status}`);
  }
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    error?: string;
  };
  if (!tokenData.access_token) {
    throw new Error(`Google: ${tokenData.error ?? "sin access_token"}`);
  }

  // Get YouTube channel
  const channelRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,id&mine=true",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  );
  let userId = "unknown";
  let username: string | undefined;
  let displayName: string | undefined;
  if (channelRes.ok) {
    const data = (await channelRes.json()) as {
      items?: Array<{ id?: string; snippet?: { title?: string; customUrl?: string } }>;
    };
    const ch = data.items?.[0];
    userId = ch?.id ?? "unknown";
    username = ch?.snippet?.customUrl;
    displayName = ch?.snippet?.title;
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined,
    userId,
    username,
    displayName,
    scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
  };
}

// ─── Pinterest ─────────────────────────────────────────────────────────
async function exchangePinterest(input: ExchangeInput): Promise<ExchangeResult> {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Pinterest client_id/secret no configurados");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
  });

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: params.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Pinterest token exchange: HTTP ${tokenRes.status}`);
  }
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    error?: string;
  };
  if (!tokenData.access_token) {
    throw new Error(`Pinterest: ${tokenData.error ?? "sin access_token"}`);
  }

  const userRes = await fetch("https://api.pinterest.com/v5/user_account", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  let userId = "unknown";
  let username: string | undefined;
  if (userRes.ok) {
    const u = (await userRes.json()) as { username?: string; account_type?: string };
    userId = u.username ?? "unknown";
    username = u.username;
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined,
    userId,
    username,
    displayName: username,
    scopes: tokenData.scope ? tokenData.scope.split(" ") : [],
  };
}
