/**
 * GET /api/social/[platform]/oauth/callback?code=xxx&state=xxx
 *
 * Step 2 del OAuth flow. El provider redirige aquí tras autorizar.
 * Verificamos el state, hacemos exchange code → tokens, guardamos
 * encrypted en SocialConnection, redirigimos a la página de Settings.
 *
 * Cada plataforma tiene su propio módulo de exchange en oauth/{platform}.ts
 * porque la mecánica del exchange + parsing de respuesta varía.
 */
import { NextRequest, NextResponse } from "next/server";
import type { SocialPlatform } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { exchangeCodeForToken } from "@/lib/social/oauth/exchange";
import { getPlatformConfig, getRedirectUri } from "@/lib/social/platforms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const platform = params.platform.toUpperCase() as SocialPlatform;
  const code = request.nextUrl.searchParams.get("code");
  const stateFromProvider = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const errMsg = `OAuth ${platform.toLowerCase()}: ${error}`;
    return redirectToBusinessSettings(request, null, errMsg);
  }
  if (!code || !stateFromProvider) {
    return redirectToBusinessSettings(request, null, "Faltan code o state");
  }

  // Verify state contra cookie
  const stateCookie = request.cookies.get(`oauth_state_${platform.toLowerCase()}`)?.value;
  if (!stateCookie || stateCookie !== stateFromProvider) {
    return redirectToBusinessSettings(request, null, "State inválido — posible CSRF");
  }

  const [businessId] = stateCookie.split(".");
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true, slug: true },
  });
  if (!business) {
    return redirectToBusinessSettings(request, null, "Business no encontrado");
  }

  // Exchange code por tokens
  let tokenResp;
  try {
    tokenResp = await exchangeCodeForToken({
      platform,
      code,
      redirectUri: getRedirectUri(platform),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "exchange failed";
    await db.auditLog
      .create({
        data: {
          businessId,
          adminUserId: session.adminUserId,
          action: "SOCIAL_OAUTH_FAILED",
          entityType: "Business",
          entityId: businessId,
          detail: { platform, error: msg },
        },
      })
      .catch(() => {});
    return redirectToBusinessSettings(request, business.slug, `Error: ${msg}`);
  }

  // Encrypt tokens
  const accessEnc = encrypt(tokenResp.accessToken);
  const refreshEnc = tokenResp.refreshToken ? encrypt(tokenResp.refreshToken) : null;

  // Upsert connection
  await db.socialConnection.upsert({
    where: { businessId_platform: { businessId, platform } },
    create: {
      businessId,
      platform,
      externalUserId: tokenResp.userId,
      externalUsername: tokenResp.username,
      externalDisplayName: tokenResp.displayName,
      accessTokenEnc: accessEnc.enc,
      accessTokenIv: accessEnc.iv,
      accessTokenTag: accessEnc.tag,
      refreshTokenEnc: refreshEnc?.enc,
      refreshTokenIv: refreshEnc?.iv,
      refreshTokenTag: refreshEnc?.tag,
      scopes: tokenResp.scopes,
      expiresAt: tokenResp.expiresAt,
      status: "ACTIVE",
      lastCheckedAt: new Date(),
    },
    update: {
      externalUserId: tokenResp.userId,
      externalUsername: tokenResp.username,
      externalDisplayName: tokenResp.displayName,
      accessTokenEnc: accessEnc.enc,
      accessTokenIv: accessEnc.iv,
      accessTokenTag: accessEnc.tag,
      refreshTokenEnc: refreshEnc?.enc,
      refreshTokenIv: refreshEnc?.iv,
      refreshTokenTag: refreshEnc?.tag,
      scopes: tokenResp.scopes,
      expiresAt: tokenResp.expiresAt,
      status: "ACTIVE",
      lastCheckedAt: new Date(),
      lastError: null,
    },
  });

  await db.auditLog
    .create({
      data: {
        businessId,
        adminUserId: session.adminUserId,
        action: "SOCIAL_CONNECTED",
        entityType: "Business",
        entityId: businessId,
        detail: {
          platform,
          username: tokenResp.username,
          scopes: tokenResp.scopes,
        },
      },
    })
    .catch(() => {});

  return redirectToBusinessSettings(request, business.slug, null, "1");
}

function redirectToBusinessSettings(
  request: NextRequest,
  slug: string | null,
  error: string | null,
  connected?: string,
): NextResponse {
  const path = slug ? `/businesses/${slug}/settings` : `/businesses`;
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  if (connected) url.searchParams.set("connected", connected);
  return NextResponse.redirect(url);
}
