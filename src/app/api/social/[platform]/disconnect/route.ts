/**
 * POST /api/social/[platform]/disconnect
 *
 * Desconecta una plataforma del business. No revoca el token en el provider
 * (eso lo hace el user en su dashboard de la plataforma) — solo lo borra
 * de nuestra DB.
 *
 * Body: { businessId: string }
 */
import { NextRequest, NextResponse } from "next/server";
import type { SocialPlatform } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = ["tiktok", "linkedin", "youtube", "pinterest"];

export async function POST(
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
  if (!VALID.includes(platformLower)) {
    return NextResponse.json({ error: "Plataforma desconocida" }, { status: 400 });
  }
  const platform = platformLower.toUpperCase() as SocialPlatform;

  let businessId: string;
  try {
    const body = await request.json();
    businessId = String(body.businessId ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!businessId) {
    return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
  }

  await db.socialConnection.deleteMany({
    where: { businessId, platform },
  });

  await db.auditLog
    .create({
      data: {
        businessId,
        adminUserId: session.adminUserId,
        action: "SOCIAL_DISCONNECTED",
        entityType: "Business",
        entityId: businessId,
        detail: { platform },
      },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
