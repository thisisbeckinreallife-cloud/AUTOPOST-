/**
 * POST /api/batches/presign — get a presigned URL for direct-to-R2 upload.
 * This bypasses Next.js/Railway body size limits.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSignedUploadUrl, batchStorageKey, checkStorageConfig } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const storageError = checkStorageConfig();
    if (storageError) {
      return NextResponse.json({ error: storageError }, { status: 503 });
    }

    await requireSession();

    const body = await request.json();
    const { businessSlug, fileName, fileSize } = body as {
      businessSlug: string;
      fileName: string;
      fileSize: number;
    };

    if (!businessSlug || !fileName) {
      return NextResponse.json(
        { error: "Missing businessSlug or fileName" },
        { status: 400 }
      );
    }

    if (fileSize > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo excede el limite de 100MB" },
        { status: 413 }
      );
    }

    const business = await db.business.findUnique({
      where: { slug: businessSlug, isActive: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    const batchId = uuidv4();
    const safeFilename = fileName
      .replace(/\.\./g, "")
      .replace(/[^a-zA-Z0-9._\-]/g, "_");
    const storageKey = batchStorageKey(business.slug, batchId, safeFilename);

    const uploadUrl = await getSignedUploadUrl(
      storageKey,
      "application/zip",
      600 // 10 minutes to complete upload
    );

    return NextResponse.json({
      data: {
        uploadUrl,
        storageKey,
        batchId,
        businessId: business.id,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Presign] Error:", msg, err);
    return NextResponse.json(
      { error: `Error generando URL de subida: ${msg}` },
      { status: 500 }
    );
  }
}
