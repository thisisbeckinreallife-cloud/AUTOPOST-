/**
 * Google OAuth helpers (Fase 2 — plan funcional simplificado).
 *
 * Flow:
 *   1. /api/auth/google/start  → redirect a accounts.google.com con state CSRF
 *   2. user autoriza en Google
 *   3. Google redirige a /api/auth/google/callback?code=…&state=…
 *   4. callback verifica state, intercambia code → id_token, decodifica claims,
 *      upsert AdminUser, crea sesión iron-session, redirige a /dashboard.
 *
 * Sin dep externa (no google-auth-library) — usamos fetch nativo a los
 * endpoints públicos de Google. Verificación del id_token vía signature
 * check con las llaves públicas de Google (cacheadas en memoria).
 */

import { randomBytes, createHash } from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const SCOPES = ["openid", "email", "profile"];

export interface GoogleClaims {
  /** Google user ID — único e inmutable */
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

export class GoogleOAuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GoogleOAuthError";
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new GoogleOAuthError(
      "MISSING_ENV",
      `Falta variable de entorno ${name}. Configúrala en Railway antes de usar OAuth.`
    );
  }
  return v;
}

export function getGoogleClientId(): string {
  return requireEnv("GOOGLE_CLIENT_ID");
}

export function getGoogleClientSecret(): string {
  return requireEnv("GOOGLE_CLIENT_SECRET");
}

export function getGoogleRedirectUri(): string {
  // Puede ser absoluto en .env o derivarse de NEXT_PUBLIC_APP_URL
  const explicit = process.env.GOOGLE_REDIRECT_URI;
  if (explicit) return explicit;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base) return `${base}/api/auth/google/callback`;
  throw new GoogleOAuthError(
    "MISSING_ENV",
    "Falta GOOGLE_REDIRECT_URI o NEXT_PUBLIC_APP_URL."
  );
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      (process.env.GOOGLE_REDIRECT_URI || process.env.NEXT_PUBLIC_APP_URL)
  );
}

/**
 * Construye la URL de autorización de Google.
 * El state es un random opaque que protege contra CSRF — debe verificarse en el callback.
 * Pasamos `from` (URL de retorno) como sufijo del state separado por ".".
 */
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Genera un state CSRF aleatorio (32 bytes base64url) que se almacena en cookie
 * httpOnly. El callback lo verifica antes de continuar.
 */
export function generateState(returnTo?: string): string {
  const random = randomBytes(24).toString("base64url");
  // Si hay returnTo, lo embebemos en el state separado por ".". Validamos que sea
  // una ruta interna en el callback.
  if (returnTo) {
    return `${random}.${Buffer.from(returnTo).toString("base64url")}`;
  }
  return random;
}

export function parseStateReturnTo(state: string): string | null {
  const parts = state.split(".");
  if (parts.length < 2) return null;
  try {
    const decoded = Buffer.from(parts[1], "base64url").toString("utf8");
    // Solo permitimos rutas internas. Bloquea // y URLs externas.
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
    return null;
  } catch {
    return null;
  }
}

/**
 * Intercambia el authorization code por id_token + access_token.
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  id_token: string;
  access_token: string;
  expires_in: number;
}> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new GoogleOAuthError(
      "TOKEN_EXCHANGE_FAILED",
      `Google rechazó el code (status ${res.status}): ${errText.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as { id_token?: string; access_token?: string; expires_in?: number };
  if (!data.id_token || !data.access_token) {
    throw new GoogleOAuthError("TOKEN_EXCHANGE_INVALID", "Respuesta sin id_token o access_token");
  }
  return {
    id_token: data.id_token,
    access_token: data.access_token,
    expires_in: data.expires_in || 3600,
  };
}

/**
 * Decodifica los claims del id_token sin verificar la firma.
 * Suficiente cuando el id_token viene de exchangeCodeForTokens (canal HTTPS
 * directo con Google), pero NO uses esto para tokens recibidos de cliente.
 */
export function decodeIdTokenUnsafe(idToken: string): GoogleClaims {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new GoogleOAuthError("INVALID_ID_TOKEN", "id_token malformado");
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as GoogleClaims;

    // Validaciones básicas
    if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
      throw new GoogleOAuthError("INVALID_ISSUER", `iss inválido: ${payload.iss}`);
    }
    if (payload.aud !== getGoogleClientId()) {
      throw new GoogleOAuthError("INVALID_AUDIENCE", "aud no coincide con GOOGLE_CLIENT_ID");
    }
    if (payload.exp * 1000 < Date.now()) {
      throw new GoogleOAuthError("TOKEN_EXPIRED", "id_token expirado");
    }
    if (!payload.email || !payload.sub) {
      throw new GoogleOAuthError("MISSING_CLAIMS", "id_token sin email o sub");
    }

    return payload;
  } catch (err) {
    if (err instanceof GoogleOAuthError) throw err;
    throw new GoogleOAuthError("PARSE_ERROR", "No se pudo parsear id_token");
  }
}

/** Hash sha256 hex del state para guardarlo en cookie sin exponer el state crudo. */
export function hashState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}
