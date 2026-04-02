import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { confirmBatch } from "@/services/scheduler/batch-processor";

export async function POST(
  _request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const session = await requireSession();

    const batch = await db.uploadBatch.findUnique({
      where: { id: params.batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (!["PARSED", "VALIDATION_FAILED"].includes(batch.status)) {
      return NextResponse.json(
        { error: `Batch cannot be confirmed in status: ${batch.status}` },
        { status: 409 }
      );
    }

    const result = await confirmBatch(batch.id);

    await db.auditLog.create({
      data: {
        businessId: batch.businessId,
        adminUserId: session.adminUserId,
        action: "BATCH_SCHEDULED",
        entityType: "UploadBatch",
        entityId: batch.id,
        detail: result,
      },
    });

    return NextResponse.json({ data: result });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Batch Confirm] Error:", msg, err);
    return NextResponse.json({ error: `Error programando publicaciones: ${msg}` }, { status: 500 });
  }
}
