/**
 * Meta OAuth callback.
 * Receives code + state from Meta, exchanges for tokens,
 * discovers linked IG account, persists encrypted tokens.
 *
 * IMPORTANT: Requires META_APP_ID, META_APP_SECRET, META_REDIRECT_URI.
 * See README.md § "Meta App Setup".
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  exchangeCodeForTokens,
  getLinkedIgAccounts,
  getPageAccessToken,
} from "@/services/meta/client";
import { encrypt } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  try {
    await requireSession();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Meta sends error if user denies
    if (error) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      return NextResponse.redirect(
        `${appUrl}/businesses?error=${encodeURIComponent(errorDescription ?? error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    // Parse state to get business slug
    let businessSlug: string;
    try {
      const stateData = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      businessSlug = stateData.businessSlug;
    } catch {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { slug: businessSlug },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Exchange code for long-lived token
    const { accessToken, expiresAt } = await exchangeCodeForTokens(code);

    // Get linked IG accounts
    const igAccounts = await getLinkedIgAccounts(accessToken);

    if (igAccounts.length === 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      return NextResponse.redirect(
        `${appUrl}/businesses/${businessSlug}/connect?error=no_ig_account`
      );
    }

    // Use first account (admin can reconnect to select different one)
    const igAccount = igAccounts[0];

    // Encrypt tokens
    const encAccessToken = encrypt(accessToken);
    const encPageToken = igAccount.pageToken
      ? encrypt(igAccount.pageToken)
      : null;

    // Upsert connection
    await db.$transaction(async (tx) => {
      await tx.metaConnection.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          igUserId: igAccount.igUserId,
          igUsername: igAccount.igUsername,
          fbPageId: igAccount.fbPageId,
          fbPageName: igAccount.fbPageName,
          accessTokenEnc: encAccessToken.enc,
          accessTokenIv: encAccessToken.iv,
          accessTokenTag: encAccessToken.tag,
          pageTokenEnc: encPageToken?.enc ?? null,
          pageTokenIv: encPageToken?.iv ?? null,
          pageTokenTag: encPageToken?.tag ?? null,
          tokenExpiresAt: expiresAt,
          status: "ACTIVE",
          lastCheckedAt: new Date(),
        },
        update: {
          igUserId: igAccount.igUserId,
          igUsername: igAccount.igUsername,
          fbPageId: igAccount.fbPageId,
          fbPageName: igAccount.fbPageName,
          accessTokenEnc: encAccessToken.enc,
          accessTokenIv: encAccessToken.iv,
          accessTokenTag: encAccessToken.tag,
          pageTokenEnc: encPageToken?.enc ?? null,
          pageTokenIv: encPageToken?.iv ?? null,
          pageTokenTag: encPageToken?.tag ?? null,
          tokenExpiresAt: expiresAt,
          status: "ACTIVE",
          lastCheckedAt: new Date(),
          lastError: null,
        },
      });

      await tx.auditLog.create({
        data: {
          businessId: business.id,
          action: "META_CONNECTION_CREATED",
          entityType: "MetaConnection",
          entityId: business.id,
          detail: {
            igUsername: igAccount.igUsername,
            fbPageName: igAccount.fbPageName,
          },
        },
      });
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.redirect(
      `${appUrl}/businesses/${businessSlug}?connected=1`
    );
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`
      );
    }
    console.error("[OAuth Callback] Error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      `${appUrl}/businesses?error=${encodeURIComponent(msg)}`
    );
  }
}
