import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    await requireSession();

    const batch = await db.uploadBatch.findUnique({
      where: { id: params.batchId },
      include: {
        postDrafts: {
          include: {
            mediaAssets: {
              select: {
                id: true,
                originalFilename: true,
                mimeType: true,
                fileSize: true,
                sortOrder: true,
                storageUrl: true,
                // Don't expose full storage paths
              },
            },
            publishJobs: {
              select: {
                id: true,
                status: true,
                scheduledFor: true,
                bullmqJobId: true,
              },
            },
          },
          orderBy: { publishAt: "asc" },
        },
        business: {
          select: { id: true, name: true, slug: true, timezone: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    return NextResponse.json({ data: batch });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
