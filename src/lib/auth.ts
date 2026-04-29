/**
 * Admin session management using iron-session (encrypted cookie).
 * No tokens exposed to client; only admin flag + id.
 */
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";

export interface AdminSessionData {
  adminUserId: string;
  email: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "fallback-secret-change-in-prod-!!",
  cookieName: "autopost_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession(): Promise<IronSession<AdminSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<AdminSessionData>(cookieStore, sessionOptions);
}

/**
 * Para páginas server-rendered: redirige a /login si no hay sesión.
 * Usar este helper en server components — produce un redirect limpio
 * en vez de un 500 por error UNAUTHORIZED no capturado.
 */
export async function requireAuth(redirectTo = "/login"): Promise<AdminSessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.adminUserId) {
    redirect(redirectTo);
  }
  return session;
}

/**
 * Para route handlers (/api/*): lanza UNAUTHORIZED para que el handler
 * lo capture y devuelva 401. NO usar en server components — usa requireAuth.
 */
export async function requireSession(): Promise<AdminSessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.adminUserId) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}

// Helper for API route handlers
export async function withAdminAuth<T>(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const sessionCookie = parseCookies(cookieHeader)[sessionOptions.cookieName];

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return await handler(request);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw err;
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
}
