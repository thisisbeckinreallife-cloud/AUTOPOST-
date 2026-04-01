import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await requireSession();

    const business = await db.business.findUnique({
      where: { slug: params.slug },
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
          },
        },
        _count: {
          select: { postDrafts: true, uploadBatches: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ data: business });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { slug: params.slug },
    });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { timezone, ...rest } = parsed.data;

    if (timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
      } catch {
        return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      const b = await tx.business.update({
        where: { slug: params.slug },
        data: { ...rest, ...(timezone ? { timezone } : {}) },
      });
      await tx.auditLog.create({
        data: {
          businessId: b.id,
          adminUserId: session.adminUserId,
          action: "BUSINESS_UPDATED",
          entityType: "Business",
          entityId: b.id,
          detail: parsed.data,
        },
      });
      return b;
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
