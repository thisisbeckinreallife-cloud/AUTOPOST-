import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  timezone: z.string().min(1),
  description: z.string().max(500).optional(),
});

export async function GET() {
  try {
    await requireSession();

    const businesses = await db.business.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        metaConnection: {
          select: {
            id: true,
            igUserId: true,
            igUsername: true,
            fbPageId: true,
            fbPageName: true,
            status: true,
            tokenExpiresAt: true,
            lastCheckedAt: true,
            lastError: true,
            // NEVER include accessTokenEnc, accessTokenIv, accessTokenTag
          },
        },
        _count: {
          select: { postDrafts: true, uploadBatches: true },
        },
      },
    });

    return NextResponse.json({ data: businesses });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Businesses] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug, timezone, description } = parsed.data;

    // Validate timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
    } catch {
      return NextResponse.json(
        { error: "Invalid timezone" },
        { status: 400 }
      );
    }

    const existing = await db.business.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A business with this slug already exists" },
        { status: 409 }
      );
    }

    const business = await db.$transaction(async (tx) => {
      const b = await tx.business.create({
        data: { name, slug, timezone, description },
      });
      await tx.auditLog.create({
        data: {
          businessId: b.id,
          adminUserId: session.adminUserId,
          action: "BUSINESS_CREATED",
          entityType: "Business",
          entityId: b.id,
          detail: { name, slug },
        },
      });
      return b;
    });

    return NextResponse.json({ data: business }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Businesses] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
