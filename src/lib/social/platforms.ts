/**
 * Registry de plataformas sociales soportadas — config OAuth + metadata UI.
 *
 * Cada plataforma define:
 *   - OAuth URLs y scopes
 *   - Cómo recuperar info del usuario tras autenticar
 *   - Si está disponible (depende de credenciales en env)
 *
 * Pattern: cada plataforma tiene un módulo en oauth/{platform}.ts y
 * adapter en adapters/{platform}.ts. Este registry centraliza la metadata.
 */
import type { SocialPlatform } from "@prisma/client";

export interface PlatformConfig {
  platform: SocialPlatform;
  displayName: string;
  icon: string;
  scopes: string[];
  /** Si true, OAuth funcional; si false, "próximamente" en UI */
  available: boolean;
  /** Razón de no disponibilidad (mostrar al user) */
  unavailableReason?: string;
  authBaseUrl: string;
  /** Qué app review se requiere para uso producción */
  appReview?: string;
}

function envFlag(...keys: string[]): boolean {
  return keys.every((k) => Boolean(process.env[k]));
}

export function getPlatformConfigs(): PlatformConfig[] {
  return [
    {
      platform: "TIKTOK",
      displayName: "TikTok",
      icon: "🎵",
      scopes: ["user.info.basic", "video.publish"],
      available: envFlag("TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET"),
      unavailableReason: !envFlag("TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET")
        ? "Esperando aprobación de TikTok API (1-2 sem)"
        : undefined,
      authBaseUrl: "https://www.tiktok.com/v2/auth/authorize/",
      appReview: "TikTok Content Posting API requires app review",
    },
    {
      platform: "LINKEDIN",
      displayName: "LinkedIn",
      icon: "in",
      scopes: ["w_member_social", "openid", "profile", "email"],
      available: envFlag("LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"),
      unavailableReason: !envFlag("LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET")
        ? "Configura LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en Railway"
        : undefined,
      authBaseUrl: "https://www.linkedin.com/oauth/v2/authorization",
    },
    {
      platform: "YOUTUBE",
      displayName: "YouTube Shorts",
      icon: "▶",
      scopes: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ],
      available: envFlag("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
      unavailableReason: !envFlag("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET")
        ? "Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en Railway"
        : undefined,
      authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      appReview: "YouTube quota inicial baja — pedir aumento desde inicio",
    },
    {
      platform: "PINTEREST",
      displayName: "Pinterest",
      icon: "📌",
      scopes: ["pins:write", "boards:read", "user_accounts:read"],
      available: envFlag("PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET"),
      unavailableReason: !envFlag("PINTEREST_CLIENT_ID", "PINTEREST_CLIENT_SECRET")
        ? "Configura PINTEREST_CLIENT_ID y PINTEREST_CLIENT_SECRET en Railway"
        : undefined,
      authBaseUrl: "https://www.pinterest.com/oauth/",
    },
  ];
}

export function getPlatformConfig(
  platform: SocialPlatform | string,
): PlatformConfig | null {
  const upper = String(platform).toUpperCase();
  return (
    getPlatformConfigs().find((p) => p.platform === upper) ?? null
  );
}

/**
 * Construye la URL de redirect OAuth para una plataforma + business.
 * El state contiene businessId + nonce para CSRF protection.
 */
export function buildOAuthUrl(
  platform: SocialPlatform,
  state: string,
  redirectUri: string,
): string | null {
  const cfg = getPlatformConfig(platform);
  if (!cfg || !cfg.available) return null;

  const params = new URLSearchParams();

  switch (platform) {
    case "TIKTOK":
      params.set("client_key", process.env.TIKTOK_CLIENT_KEY!);
      params.set("scope", cfg.scopes.join(","));
      params.set("response_type", "code");
      params.set("redirect_uri", redirectUri);
      params.set("state", state);
      break;
    case "LINKEDIN":
      params.set("response_type", "code");
      params.set("client_id", process.env.LINKEDIN_CLIENT_ID!);
      params.set("redirect_uri", redirectUri);
      params.set("state", state);
      params.set("scope", cfg.scopes.join(" "));
      break;
    case "YOUTUBE":
      params.set("client_id", process.env.GOOGLE_CLIENT_ID!);
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
      params.set("scope", cfg.scopes.join(" "));
      params.set("state", state);
      params.set("access_type", "offline");
      params.set("prompt", "consent");
      break;
    case "PINTEREST":
      params.set("client_id", process.env.PINTEREST_CLIENT_ID!);
      params.set("redirect_uri", redirectUri);
      params.set("response_type", "code");
      params.set("scope", cfg.scopes.join(" "));
      params.set("state", state);
      break;
  }

  return `${cfg.authBaseUrl}?${params.toString()}`;
}

/**
 * Devuelve el redirect URI para callbacks. Construido desde NEXT_PUBLIC_APP_URL.
 */
export function getRedirectUri(platform: SocialPlatform): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopost.app";
  return `${base.replace(/\/$/, "")}/api/social/${platform.toLowerCase()}/oauth/callback`;
}
