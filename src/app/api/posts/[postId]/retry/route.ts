import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { retryPublishJobNow } from "@/services/scheduler/queue";

export async function POST(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await requireSession();

    const draft = await db.postDraft.findUnique({
      where: { id: params.postId },
      include: { publishJobs: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!draft) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (draft.status !== "FAILED") {
      return NextResponse.json(
        { error: `Post must be in FAILED status to retry (current: ${draft.status})` },
        { status: 409 }
      );
    }

    const publishJob = draft.publishJobs[0];
    if (!publishJob) {
      return NextResponse.json(
        { error: "No publish job found for this post" },
        { status: 404 }
      );
    }

    await db.postDraft.update({
      where: { id: draft.id },
      data: { status: "SCHEDULED" },
    });

    await db.publishJob.update({
      where: { id: publishJob.id },
      data: { status: "PENDING" },
    });

    await retryPublishJobNow(publishJob.id);

    await db.auditLog.create({
      data: {
        businessId: draft.businessId,
        adminUserId: session.adminUserId,
        action: "POST_RETRY_REQUESTED",
        entityType: "PostDraft",
        entityId: draft.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
