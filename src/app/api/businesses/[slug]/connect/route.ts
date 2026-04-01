/**
 * Meta OAuth connection routes for a business.
 * GET  → initiate OAuth (redirect to Meta)
 * POST → disconnect
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { buildOAuthUrl } from "@/services/meta/client";
import { encrypt } from "@/lib/crypto";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requireSession();

    const business = await db.business.findUnique({
      where: { slug: params.slug },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // State encodes business slug for callback verification
    const state = Buffer.from(
      JSON.stringify({ businessSlug: params.slug, nonce: uuidv4() })
    ).toString("base64url");

    const oauthUrl = buildOAuthUrl(state);

    return NextResponse.json({ data: { oauthUrl } });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.includes("META_APP_ID")) {
      return NextResponse.json(
        {
          error:
            "Meta App not configured. Set META_APP_ID and META_APP_SECRET in environment.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await requireSession();

    const business = await db.business.findUnique({
      where: { slug: params.slug },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    await db.$transaction([
      db.metaConnection.deleteMany({ where: { businessId: business.id } }),
      db.auditLog.create({
        data: {
          businessId: business.id,
          adminUserId: session.adminUserId,
          action: "META_CONNECTION_REMOVED",
          entityType: "MetaConnection",
          entityId: business.id,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
