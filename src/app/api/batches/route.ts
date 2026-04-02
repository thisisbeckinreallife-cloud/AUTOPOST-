/**
 * POST /api/batches — upload a ZIP file for a business
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Allow up to 100MB uploads (Next.js App Router defaults to ~4.5MB)
export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth";
import { uploadBuffer, batchStorageKey, checkStorageConfig } from "@/lib/storage";
import { hashSHA256 } from "@/lib/crypto";
import { processBatch } from "@/services/scheduler/batch-processor";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Pre-flight: check storage is configured before doing any work
    const storageError = checkStorageConfig();
    if (storageError) {
      return NextResponse.json({ error: storageError }, { status: 503 });
    }

    const session = await requireSession();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const businessSlug = formData.get("businessSlug") as string | null;

    if (!file || !businessSlug) {
      return NextResponse.json(
        { error: "Missing file or businessSlug" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".zip") && file.type !== "application/zip") {
      return NextResponse.json(
        { error: "File must be a ZIP archive" },
        { status: 400 }
      );
    }

    // Max 100MB
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ZIP file exceeds maximum size of 100MB" },
        { status: 413 }
      );
    }

    const business = await db.business.findUnique({
      where: { slug: businessSlug, isActive: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found or inactive" },
        { status: 404 }
      );
    }

    let zipBuffer: Buffer;
    try {
      const arrayBuf = await file.arrayBuffer();
      zipBuffer = Buffer.from(arrayBuf);
    } catch (bufErr) {
      console.error("[Batches] Failed to read file buffer:", bufErr);
      return NextResponse.json(
        { error: `Error leyendo el archivo (${file.size} bytes). Puede ser demasiado grande.` },
        { status: 400 }
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

    const batchId = uuidv4();

    // Sanitize filename
    const safeFilename = file.name
      .replace(/\.\./g, "")
      .replace(/[^a-zA-Z0-9._\-]/g, "_");
    const storageKey = batchStorageKey(business.slug, batchId, safeFilename);

    // Upload ZIP to storage
    try {
      await uploadBuffer(storageKey, zipBuffer, "application/zip");
    } catch (s3Err) {
      const msg = s3Err instanceof Error ? s3Err.message : String(s3Err);
      console.error("[Batches] S3 upload failed:", msg, s3Err);
      return NextResponse.json(
        { error: `Error subiendo al almacenamiento: ${msg}` },
        { status: 502 }
      );
    }

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
            fileSize: file.size,
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
            detail: { filename: safeFilename, fileSize: file.size },
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

    // Process batch asynchronously (parse + validate + create drafts)
    processBatch(batch.id, zipBuffer, business.id, business.slug).catch(
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
