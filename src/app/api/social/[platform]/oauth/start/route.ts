/**
 * GET /api/social/[platform]/oauth/start?businessId=xxx
 *
 * Step 1 del OAuth flow. Genera el state CSRF, guarda en cookie iron-session
 * temporal, y redirige al provider para autorización.
 *
 * El callback (/oauth/callback) lee el state de la cookie y lo verifica
 * contra el state devuelto por el provider antes de hacer el exchange.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import type { SocialPlatform } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { buildOAuthUrl, getRedirectUri, getPlatformConfig } from "@/lib/social/platforms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PLATFORMS = ["tiktok", "linkedin", "youtube", "pinterest"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platformLower = params.platform.toLowerCase();
  if (!VALID_PLATFORMS.includes(platformLower as (typeof VALID_PLATFORMS)[number])) {
    return NextResponse.json({ error: "Plataforma desconocida" }, { status: 400 });
  }
  const platform = platformLower.toUpperCase() as SocialPlatform;
  const businessId = request.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
  }

  // Verificar ownership business (admin scope: cualquier admin logueado puede)
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, slug: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const cfg = getPlatformConfig(platform);
  if (!cfg) {
    return NextResponse.json({ error: "Plataforma no soportada" }, { status: 400 });
  }
  if (!cfg.available) {
    return NextResponse.json(
      {
        error: `${cfg.displayName} no disponible`,
        reason: cfg.unavailableReason,
      },
      { status: 503 },
    );
  }

  // Generar state CSRF: businessId.nonce
  const nonce = randomBytes(16).toString("hex");
  const state = `${businessId}.${nonce}`;
  const redirectUri = getRedirectUri(platform);
  const authUrl = buildOAuthUrl(platform, state, redirectUri);
  if (!authUrl) {
    return NextResponse.json({ error: "No se pudo construir URL OAuth" }, { status: 500 });
  }

  await db.auditLog
    .create({
      data: {
        businessId,
        adminUserId: session.adminUserId,
        action: "SOCIAL_OAUTH_START",
        entityType: "Business",
        entityId: businessId,
        detail: { platform, redirectUri },
      },
    })
    .catch(() => {});

  // Guardar state en cookie httpOnly para verificar en callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(`oauth_state_${platform.toLowerCase()}`, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });
  return response;
}
