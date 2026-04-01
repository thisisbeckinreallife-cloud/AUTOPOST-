import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

const updateSchema = z.object({
  caption: z.string().max(2200).optional(),
  publishAt: z.string().optional(), // ISO 8601 or simple datetime
  status: z.enum(["CANCELLED"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    await requireSession();

    const draft = await db.postDraft.findUnique({
      where: { id: params.postId },
      include: {
        mediaAssets: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            fileSize: true,
            sortOrder: true,
            storageUrl: true,
            width: true,
            height: true,
            durationSec: true,
          },
        },
        publishJobs: {
          include: {
            attempts: {
              orderBy: { attemptNumber: "asc" },
            },
          },
        },
        business: {
          select: { id: true, name: true, slug: true, timezone: true },
        },
        batch: {
          select: { id: true, originalFilename: true, status: true },
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ data: draft });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
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

    const draft = await db.postDraft.findUnique({
      where: { id: params.postId },
    });
    if (!draft) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow edits on drafts in certain states
    const editableStatuses = ["DRAFT", "VALIDATED", "READY"];
    if (
      parsed.data.caption !== undefined &&
      !editableStatuses.includes(draft.status)
    ) {
      return NextResponse.json(
        {
          error: `Cannot edit post in status "${draft.status}". Cancel and re-import.`,
        },
        { status: 409 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.caption) {
      updates.caption = parsed.data.caption;
      const { hashSHA256 } = await import("@/lib/crypto");
      updates.captionHash = hashSHA256(parsed.data.caption);
    }
    if (parsed.data.publishAt) {
      const publishAt = new Date(parsed.data.publishAt);
      if (publishAt <= new Date()) {
        return NextResponse.json(
          { error: "Publish time must be in the future" },
          { status: 400 }
        );
      }
      updates.publishAt = publishAt;
    }
    if (parsed.data.status === "CANCELLED") {
      updates.status = "CANCELLED";
    }

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.postDraft.update({
        where: { id: params.postId },
        data: updates,
      });
      await tx.auditLog.create({
        data: {
          businessId: draft.businessId,
          adminUserId: session.adminUserId,
          action: "POST_UPDATED",
          entityType: "PostDraft",
          entityId: draft.id,
          detail: updates as unknown as import("@prisma/client").Prisma.InputJsonValue,
        },
      });
      return u;
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
