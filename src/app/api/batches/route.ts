/**
 * POST /api/batches — process a ZIP that was already uploaded to R2 via presigned URL.
 * Accepts JSON body (small) instead of multipart file upload (large).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth";
import { downloadBuffer, checkStorageConfig } from "@/lib/storage";
import { hashSHA256 } from "@/lib/crypto";
import { processBatch, type ScheduleOverride } from "@/services/scheduler/batch-processor";

export async function POST(request: NextRequest) {
  try {
    const storageError = checkStorageConfig();
    if (storageError) {
      return NextResponse.json({ error: storageError }, { status: 503 });
    }

    const session = await requireSession();

    const body = await request.json();
    const {
      batchId,
      businessId,
      storageKey,
      fileName,
      fileSize,
      schedule,
    } = body as {
      batchId: string;
      businessId: string;
      storageKey: string;
      fileName: string;
      fileSize: number;
      schedule?: ScheduleOverride[];
    };

    if (!batchId || !businessId || !storageKey || !fileName) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (batchId, businessId, storageKey, fileName)" },
        { status: 400 }
      );
    }

    // Verify business exists
    const business = await db.business.findUnique({
      where: { id: businessId, isActive: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found or inactive" },
        { status: 404 }
      );
    }

    // Download ZIP from R2
    let zipBuffer: Buffer;
    try {
      zipBuffer = await downloadBuffer(storageKey);
    } catch (dlErr) {
      const msg = dlErr instanceof Error ? dlErr.message : String(dlErr);
      console.error("[Batches] Failed to download from R2:", msg);
      return NextResponse.json(
        { error: `Error descargando archivo de almacenamiento: ${msg}` },
        { status: 502 }
      );
    }

    const fileHash = hashSHA256(zipBuffer);

    // Prevent reprocessing the same ZIP
    const existingBatch = await db.uploadBatch.findFirst({
      where: { businessId: business.id, fileHash },
    });
    if (existingBatch) {
      return NextResponse.json(
        {
          error: "Este ZIP ya fue subido anteriormente.",
          data: { batchId: existingBatch.id, status: existingBatch.status },
        },
        { status: 409 }
      );
    }

    const safeFilename = fileName
      .replace(/\.\./g, "")
      .replace(/[^a-zA-Z0-9._\-]/g, "_");

    // Create batch record
    let batch;
    try {
      batch = await db.$transaction(async (tx) => {
        const b = await tx.uploadBatch.create({
          data: {
            id: batchId,
            businessId: business.id,
            originalFilename: safeFilename,
            storagePath: storageKey,
            fileSize: fileSize || zipBuffer.length,
            fileHash,
            status: "UPLOADED",
            uploadedByIp:
              request.headers.get("x-forwarded-for") ??
              request.headers.get("x-real-ip") ??
              null,
          },
        });
        await tx.auditLog.create({
          data: {
            businessId: business.id,
            adminUserId: session.adminUserId,
            action: "BATCH_UPLOADED",
            entityType: "UploadBatch",
            entityId: b.id,
            detail: { filename: safeFilename, fileSize: fileSize || zipBuffer.length },
          },
        });
        return b;
      });
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[Batches] DB transaction failed:", msg, dbErr);
      return NextResponse.json(
        { error: `Error guardando en base de datos: ${msg}` },
        { status: 500 }
      );
    }

    // Process batch asynchronously
    processBatch(batch.id, zipBuffer, business.id, business.slug, schedule).catch(
      (err) => {
        console.error(`[Batch] Processing error for ${batch.id}:`, err);
      }
    );

    return NextResponse.json(
      { data: { batchId: batch.id, status: "PARSING" } },
      { status: 202 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Batches] POST error:", errorMessage, err);
    return NextResponse.json(
      { error: `Error procesando el archivo: ${errorMessage}` },
      { status: 500 }
    );
  }
}
