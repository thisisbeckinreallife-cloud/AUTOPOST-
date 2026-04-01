import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { z } from "zod";

const querySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(
  request: NextRequest,
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

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const where = {
      businessId: business.id,
      ...(query.status ? { status: query.status as never } : {}),
    };

    const [posts, total] = await Promise.all([
      db.postDraft.findMany({
        where,
        orderBy: { publishAt: "asc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: { select: { mediaAssets: true } },
        },
      }),
      db.postDraft.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
