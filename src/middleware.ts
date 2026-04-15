import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type AdminSessionData } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and meta oauth callback
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/meta/oauth/callback"
  ) {
    return NextResponse.next();
  }

  // Check session for admin routes and API routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/businesses") ||
    pathname.startsWith("/logs") ||
    pathname.startsWith("/settings") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth"))
  ) {
    const response = NextResponse.next();
    const session = await getIronSession<AdminSessionData>(
      request,
      response,
      sessionOptions
    );

    if (!session.isLoggedIn) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
