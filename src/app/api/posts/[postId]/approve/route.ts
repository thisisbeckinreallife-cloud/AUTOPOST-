import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await requireSession();

    const post = await db.postDraft.findUnique({ where: { id: params.postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const updated = await db.postDraft.update({
      where: { id: params.postId },
      data: {
        approvalStatus: "APPROVED",
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await db.auditLog.create({
      data: {
        businessId: post.businessId,
        action: "POST_APPROVED",
        entityType: "PostDraft",
        entityId: post.id,
      },
    });

    return NextResponse.json({ data: { id: updated.id, approvalStatus: updated.approvalStatus } });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[approve]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
