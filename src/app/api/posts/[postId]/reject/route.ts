import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await requireSession();

    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = bodySchema.parse(body).reason;
    } catch {
      // body is optional
    }

    const post = await db.postDraft.findUnique({ where: { id: params.postId } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const updated = await db.postDraft.update({
      where: { id: params.postId },
      data: {
        approvalStatus: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason ?? null,
        approvedAt: null,
      },
    });

    await db.auditLog.create({
      data: {
        businessId: post.businessId,
        action: "POST_REJECTED",
        entityType: "PostDraft",
        entityId: post.id,
        detail: reason ? { reason } : undefined,
      },
    });

    return NextResponse.json({ data: { id: updated.id, approvalStatus: updated.approvalStatus } });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[reject]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
