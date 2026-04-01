/**
 * POST /api/batches — upload a ZIP file for a business
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { uploadBuffer, batchStorageKey } from "@/lib/storage";
import { hashSHA256 } from "@/lib/crypto";
import { processBatch } from "@/services/scheduler/batch-processor";
import type { ScheduleOptions } from "@/services/parser/zip-parser";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
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

    // Read schedule preferences from form data
    const scheduleOpts: ScheduleOptions = {};
    const sd = formData.get("startDate") as string | null;
    const st = formData.get("startTime") as string | null;
    const freq = formData.get("frequency") as string | null;
    const ch = formData.get("customHours") as string | null;
    if (sd) scheduleOpts.startDate = sd;
    if (st) scheduleOpts.startTime = st;
    if (freq === "daily" || freq === "custom") scheduleOpts.frequency = freq;
    if (ch) scheduleOpts.customHours = parseInt(ch, 10) || undefined;

    const zipBuffer = Buffer.from(await file.arrayBuffer());
    const fileHash = hashSHA256(zipBuffer);

    // Prevent reprocessing the same ZIP
    const existingBatch = await db.uploadBatch.findFirst({
      where: { businessId: business.id, fileHash },
    });
    if (existingBatch) {
      return NextResponse.json(
        {
          error: "This ZIP has already been uploaded",
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
    await uploadBuffer(storageKey, zipBuffer, "application/zip");

    // Create batch record
    const batch = await db.$transaction(async (tx) => {
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

    // Process batch asynchronously (parse + validate + create drafts)
    // In production, this should be done in a background job.
    // Here we process inline but return the batch ID immediately.
    processBatch(batch.id, zipBuffer, business.id, business.slug, scheduleOpts).catch(
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
    console.error("[Batches] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
