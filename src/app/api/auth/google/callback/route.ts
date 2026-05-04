import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  decodeIdTokenUnsafe,
  exchangeCodeForTokens,
  GoogleOAuthError,
  hashState,
  parseStateReturnTo,
} from "@/lib/auth/google";

const STATE_COOKIE = "google_oauth_state";

/**
 * GET /api/auth/google/callback?code=…&state=…
 *
 * 1. Verifica state contra cookie httpOnly (CSRF).
 * 2. Intercambia code por id_token + access_token.
 * 3. Decodifica claims, valida iss/aud/exp.
 * 4. Upsert AdminUser:
 *    - Si googleId ya existe → login.
 *    - Si email existe (signup tradicional previo) → vincula googleId.
 *    - Si no existe → crea cuenta nueva con provider="google".
 * 5. Crea sesión iron-session.
 * 6. Redirige a `from` (parseado del state) o /dashboard.
 *
 * En caso de error: redirige a /login con `?error=<code>` para que la UI
 * muestre microcopy claro en español plano (no JSON crudo).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const baseRedirect = (path: string, qs?: Record<string, string>) => {
    const u = new URL(path, request.url);
    if (qs) for (const [k, v] of Object.entries(qs)) u.searchParams.set(k, v);
    return NextResponse.redirect(u, { status: 302 });
  };

  // Usuario rechazó el consent en Google
  if (errorParam) {
    return baseRedirect("/login", { error: "google_cancelled" });
  }
  if (!code || !state) {
    return baseRedirect("/login", { error: "google_invalid_callback" });
  }

  // Verificar state CSRF
  const savedHash = request.cookies.get(STATE_COOKIE)?.value;
  if (!savedHash || hashState(state) !== savedHash) {
    return baseRedirect("/login", { error: "google_state_mismatch" });
  }

  try {
    // 1. Token exchange
    const tokens = await exchangeCodeForTokens(code);

    // 2. Decodificar claims (id_token viene del canal HTTPS directo con Google,
    //    así que omitimos verificación de signature en aras de simplicidad).
    const claims = decodeIdTokenUnsafe(tokens.id_token);

    // 3. Upsert user
    const email = claims.email.toLowerCase().trim();
    let user = await db.adminUser.findUnique({ where: { email } });

    if (!user) {
      // Cuenta nueva — provider google, sin password
      user = await db.adminUser.create({
        data: {
          email,
          provider: "google",
          googleId: claims.sub,
          name: claims.name || claims.given_name || null,
          avatar: claims.picture || null,
          emailVerified: claims.email_verified ?? true,
        },
      });
    } else if (!user.googleId) {
      // Cuenta existente sin OAuth — vinculamos. No sobreescribimos password.
      user = await db.adminUser.update({
        where: { id: user.id },
        data: {
          googleId: claims.sub,
          name: user.name || claims.name || claims.given_name || null,
          avatar: user.avatar || claims.picture || null,
          emailVerified: true,
        },
      });
    } else if (user.googleId !== claims.sub) {
      // Email coincide pero googleId distinto → mismo email, otra cuenta Google
      // Caso muy raro pero posible. Bloqueamos para que el usuario use email/pw.
      return baseRedirect("/login", { error: "google_email_collision" });
    }

    // 4. Crear sesión iron-session
    const session = await getSession();
    session.adminUserId = user.id;
    session.email = user.email;
    session.isLoggedIn = true;
    await session.save();

    // 5. Limpiar state cookie
    const returnTo = parseStateReturnTo(state) || "/dashboard";
    const response = baseRedirect(returnTo);
    response.cookies.delete(STATE_COOKIE);
    return response;
  } catch (err) {
    console.error("[Auth/Google callback]", err);
    if (err instanceof GoogleOAuthError) {
      return baseRedirect("/login", { error: `google_${err.code.toLowerCase()}` });
    }
    return baseRedirect("/login", { error: "google_internal" });
  }
}
