import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

const bulkSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    ids: z.array(z.string().min(1)).min(1).max(100),
  }),
  z.object({
    action: z.literal("reschedule"),
    ids: z.array(z.string().min(1)).min(1).max(100),
    publishAt: z.string().datetime({ offset: true }),
  }),
  z.object({
    action: z.literal("reschedule_relative"),
    ids: z.array(z.string().min(1)).min(1).max(100),
    offsetHours: z.number().int().refine((n) => n !== 0, "Offset must be non-zero"),
  }),
]);

const CANCELLABLE = ["DRAFT", "VALIDATED", "READY", "SCHEDULED"];
const RESCHEDULABLE = ["DRAFT", "VALIDATED", "READY", "SCHEDULED"];

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, ids } = parsed.data;

    const drafts = await db.postDraft.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, businessId: true, publishAt: true },
    });

    if (drafts.length === 0) {
      return NextResponse.json({ error: "No posts found" }, { status: 404 });
    }

    if (action === "cancel") {
      const eligible = drafts.filter((d) => CANCELLABLE.includes(d.status));
      if (eligible.length === 0) {
        return NextResponse.json(
          { error: "None of the selected posts can be cancelled" },
          { status: 409 }
        );
      }

      const now = new Date();
      await db.$transaction([
        db.postDraft.updateMany({
          where: { id: { in: eligible.map((d) => d.id) } },
          data: { status: "CANCELLED" },
        }),
        db.auditLog.createMany({
          data: eligible.map((d) => ({
            businessId: d.businessId,
            adminUserId: session.adminUserId,
            action: "POST_UPDATED",
            entityType: "PostDraft",
            entityId: d.id,
            detail: { status: "CANCELLED", bulk: true, at: now.toISOString() } as Prisma.InputJsonValue,
          })),
        }),
      ]);

      return NextResponse.json({
        updated: eligible.length,
        skipped: drafts.length - eligible.length,
        action: "cancel",
      });
    }

    if (action === "reschedule" || action === "reschedule_relative") {
      const eligible = drafts.filter((d) => RESCHEDULABLE.includes(d.status));
      if (eligible.length === 0) {
        return NextResponse.json(
          { error: "None of the selected posts can be rescheduled" },
          { status: 409 }
        );
      }

      const now = new Date();

      if (action === "reschedule") {
        const newAt = new Date(parsed.data.publishAt);
        if (newAt <= now) {
          return NextResponse.json(
            { error: "Publish time must be in the future" },
            { status: 400 }
          );
        }
        await db.$transaction([
          db.postDraft.updateMany({
            where: { id: { in: eligible.map((d) => d.id) } },
            data: { publishAt: newAt },
          }),
          db.auditLog.createMany({
            data: eligible.map((d) => ({
              businessId: d.businessId,
              adminUserId: session.adminUserId,
              action: "POST_UPDATED",
              entityType: "PostDraft",
              entityId: d.id,
              detail: { publishAt: newAt.toISOString(), bulk: true } as Prisma.InputJsonValue,
            })),
          }),
        ]);
      } else if (parsed.data.action === "reschedule_relative") {
        const offsetHours = parsed.data.offsetHours;
        const offsetMs = offsetHours * 60 * 60 * 1000;
        // Per-post update (each keeps its relative shift)
        await db.$transaction(
          eligible.flatMap((d) => {
            const newAt = new Date(d.publishAt.getTime() + offsetMs);
            const log = db.auditLog.create({
              data: {
                businessId: d.businessId,
                adminUserId: session.adminUserId,
                action: "POST_UPDATED",
                entityType: "PostDraft",
                entityId: d.id,
                detail: {
                  publishAt: newAt.toISOString(),
                  offsetHours,
                  bulk: true,
                } as Prisma.InputJsonValue,
              },
            });
            const update = db.postDraft.update({
              where: { id: d.id },
              data: { publishAt: newAt },
            });
            return [update, log];
          })
        );
      }

      return NextResponse.json({
        updated: eligible.length,
        skipped: drafts.length - eligible.length,
        action,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[bulk posts]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
