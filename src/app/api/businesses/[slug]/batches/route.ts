import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

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

    const batches = await db.uploadBatch.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { postDrafts: true } },
      },
    });

    return NextResponse.json({ data: batches });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
