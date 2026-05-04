import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  generateState,
  hashState,
  isGoogleOAuthConfigured,
  GoogleOAuthError,
} from "@/lib/auth/google";

const STATE_COOKIE = "google_oauth_state";
const STATE_MAX_AGE = 10 * 60; // 10 minutos para completar el flow

/**
 * GET /api/auth/google/start
 *
 * Inicia el flow de Google OAuth. Lee `from` del query (URL de retorno),
 * genera state CSRF, lo guarda hasheado en cookie httpOnly y redirige
 * al consent screen de Google.
 *
 * Si las credenciales no están configuradas en Railway, devuelve 503
 * con mensaje claro (no crashea silenciosamente).
 */
export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "google_oauth_not_configured",
        message:
          "Google OAuth no está configurado. Falta GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI.",
      },
      { status: 503 }
    );
  }

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from") || "/dashboard";
    // Solo permitir rutas internas
    const safeFrom = from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";

    const state = generateState(safeFrom);
    const stateHash = hashState(state);
    const authUrl = buildGoogleAuthUrl(state);

    const response = NextResponse.redirect(authUrl, { status: 302 });
    // Cookie con el HASH del state (no el state crudo) para mitigar leakage
    response.cookies.set(STATE_COOKIE, stateHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: STATE_MAX_AGE,
      path: "/api/auth/google",
    });
    return response;
  } catch (err) {
    if (err instanceof GoogleOAuthError) {
      console.error("[Auth/Google start]", err.code, err.message);
      return NextResponse.json({ error: err.code, message: err.message }, { status: 500 });
    }
    console.error("[Auth/Google start] unexpected", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
