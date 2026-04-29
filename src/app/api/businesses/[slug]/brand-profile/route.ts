/**
 * GET/PUT /api/businesses/[slug]/brand-profile
 *
 * Brand DNA del business. Soporta:
 *   - GET: devuelve el profile actual (o lo crea con level=L1 si no existe)
 *   - PUT: guarda los datos del questionnaire (bootstrap → L2)
 *
 * Cuando un usuario completa el questionnaire al crear un business,
 * el profile pasa de L1 (genérico) a L2 (70% calidad de output desde
 * el primer post). Esto se hace ANTES de tener data publicada para
 * que la IA acierte desde minuto 1.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const bootstrapSchema = z.object({
  bootstrapTone: z
    .enum(["formal_editorial", "casual_cercano", "irreverente", "premium_luxury", "tecnico"])
    .optional(),
  bootstrapDescription: z.string().max(500).optional(),
  bootstrapExamples: z.array(z.string().min(10).max(2200)).max(10).optional(),
  bootstrapImages: z.array(z.string().url()).max(20).optional(),
  bootstrapNiche: z.string().max(80).optional(),
  bootstrapTaboos: z.array(z.string().min(2).max(80)).max(20).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    await requireSession();
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

  let profile = await db.brandProfile.findUnique({
    where: { businessId: business.id },
  });

  // Si no existe, crear con level=L1 (cold start)
  if (!profile) {
    profile = await db.brandProfile.create({
      data: {
        businessId: business.id,
        level: "L1",
      },
    });
  }

  return NextResponse.json({ profile });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = bootstrapSchema.safeParse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Si hay datos suficientes en el bootstrap, subimos a L2 (onboarded)
  const data = parsed.data;
  const hasSufficientBootstrap =
    !!data.bootstrapTone &&
    !!data.bootstrapDescription &&
    !!data.bootstrapNiche &&
    (data.bootstrapExamples?.length ?? 0) >= 3;

  const profile = await db.brandProfile.upsert({
    where: { businessId: business.id },
    create: {
      businessId: business.id,
      level: hasSufficientBootstrap ? "L2" : "L1",
      bootstrapTone: data.bootstrapTone,
      bootstrapDescription: data.bootstrapDescription,
      bootstrapExamples: data.bootstrapExamples as unknown as Prisma.InputJsonValue,
      bootstrapImages: data.bootstrapImages as unknown as Prisma.InputJsonValue,
      bootstrapNiche: data.bootstrapNiche,
      bootstrapTaboos: data.bootstrapTaboos as unknown as Prisma.InputJsonValue,
    },
    update: {
      level: hasSufficientBootstrap ? "L2" : "L1",
      bootstrapTone: data.bootstrapTone,
      bootstrapDescription: data.bootstrapDescription,
      bootstrapExamples: data.bootstrapExamples as unknown as Prisma.InputJsonValue,
      bootstrapImages: data.bootstrapImages as unknown as Prisma.InputJsonValue,
      bootstrapNiche: data.bootstrapNiche,
      bootstrapTaboos: data.bootstrapTaboos as unknown as Prisma.InputJsonValue,
    },
  });

  await db.auditLog
    .create({
      data: {
        businessId: business.id,
        adminUserId: session.adminUserId,
        action: "BRAND_PROFILE_UPDATED",
        entityType: "BrandProfile",
        entityId: profile.id,
        detail: {
          level: profile.level,
          fieldsProvided: {
            tone: !!data.bootstrapTone,
            description: !!data.bootstrapDescription,
            niche: !!data.bootstrapNiche,
            examplesCount: data.bootstrapExamples?.length ?? 0,
            imagesCount: data.bootstrapImages?.length ?? 0,
            taboosCount: data.bootstrapTaboos?.length ?? 0,
          },
        },
      },
    })
    .catch(() => {});

  return NextResponse.json({ profile });
}
