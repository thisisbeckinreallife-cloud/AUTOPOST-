/**
 * POST /api/businesses/[slug]/brand-profile/train-voice
 *
 * Entrena el voice fingerprint del business desde sus posts publicados.
 * Necesita 10+ posts con caption no vacío. Sube el BrandProfile.level de
 * L2 → L3 y guarda el profile JSON en BrandProfile.voiceProfile.
 *
 * Coste: ~$0.05 por refresh (1 llamada a Sonnet con todos los captions).
 * No descuenta créditos — es un coste interno (incluido en el plan).
 *
 * Auth: requireSession (admin).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { trainVoiceFingerprint } from "@/lib/ai/voice-trainer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const result = await trainVoiceFingerprint(business.id);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error ?? result.reason ?? "No se pudo entrenar la voz",
        reason: result.reason,
      },
      { status: result.reason ? 422 : 500 },
    );
  }

  await db.auditLog
    .create({
      data: {
        businessId: business.id,
        adminUserId: session.adminUserId,
        action: "BRAND_VOICE_TRAINED",
        entityType: "BrandProfile",
        entityId: business.id,
        detail: {
          level: result.level ?? "L3",
          postsAnalyzed: result.profile?.postsAnalyzed ?? 0,
          detectedTone: result.profile?.detectedTone,
        },
      },
    })
    .catch(() => {});

  return NextResponse.json({
    profile: result.profile,
    level: result.level,
  });
}
