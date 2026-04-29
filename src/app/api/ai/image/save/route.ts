/**
 * POST /api/ai/image/save
 *
 * Cierra el loop de generación: descarga la imagen temporal de Together,
 * la sube a R2, y crea un MediaAsset asociado a un PostDraft.
 *
 * Together hospeda las imágenes generadas ~1h. Para que el usuario pueda
 * publicar el post después, necesitamos copiarlas a nuestro storage.
 *
 * Body:
 *   {
 *     postDraftId: string,
 *     imageUrl: string,           // URL temporal de Together
 *     width?: number,
 *     height?: number,
 *     promptUsed?: string,        // para audit
 *   }
 *
 * Response 200:
 *   { mediaAssetId, storageUrl, sortOrder }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  uploadBuffer,
  getPublicUrl,
  assetStorageKey,
  checkStorageConfig,
} from "@/lib/storage";

const bodySchema = z.object({
  postDraftId: z.string().min(1),
  imageUrl: z.string().url(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  promptUsed: z.string().max(2000).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Storage check
  const storageError = checkStorageConfig();
  if (storageError) {
    return NextResponse.json({ error: storageError }, { status: 503 });
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { postDraftId, imageUrl, width, height, promptUsed } = parsed.data;

  // Verificar que el post existe y está editable
  const post = await db.postDraft.findUnique({
    where: { id: postDraftId },
    include: {
      business: { select: { slug: true } },
      mediaAssets: { select: { sortOrder: true } },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (!["DRAFT", "VALIDATED", "READY"].includes(post.status)) {
    return NextResponse.json(
      { error: `No se puede añadir asset en estado "${post.status}"` },
      { status: 409 },
    );
  }

  // Descargar la imagen de Together
  let buffer: Buffer;
  let contentType = "image/jpeg";
  try {
    const fetchRes = await fetch(imageUrl, {
      headers: { "User-Agent": "AutoPost/1.0 (image-fetch)" },
    });
    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: `No se pudo descargar la imagen: HTTP ${fetchRes.status}` },
        { status: 502 },
      );
    }
    contentType = fetchRes.headers.get("content-type") || "image/jpeg";
    const arr = await fetchRes.arrayBuffer();
    buffer = Buffer.from(arr);
  } catch (err) {
    console.error("[ai/image/save] download failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error descargando la imagen",
      },
      { status: 502 },
    );
  }

  // Calcular hash + extensión
  const fileHash = createHash("sha256").update(buffer).digest("hex");
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  const filename = `ai-${randomUUID().slice(0, 8)}.${ext}`;
  const folderName = "ai-generated";
  const storageKey = assetStorageKey(
    post.business.slug,
    "ai", // batchId placeholder for AI-generated content
    folderName,
    filename,
  );

  try {
    await uploadBuffer(storageKey, buffer, contentType);
  } catch (err) {
    console.error("[ai/image/save] upload failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Error subiendo a storage: ${err.message}`
            : "Error subiendo a storage",
      },
      { status: 500 },
    );
  }

  const storageUrl = getPublicUrl(storageKey);
  const nextSortOrder =
    post.mediaAssets.length === 0
      ? 0
      : Math.max(...post.mediaAssets.map((a) => a.sortOrder)) + 1;

  // Crear MediaAsset
  const asset = await db.mediaAsset.create({
    data: {
      postDraftId: post.id,
      originalFilename: filename,
      storagePath: storageKey,
      storageUrl,
      mimeType: contentType,
      fileSize: buffer.length,
      fileHash,
      width,
      height,
      sortOrder: nextSortOrder,
    },
  });

  await db.auditLog
    .create({
      data: {
        businessId: post.businessId,
        adminUserId: session.adminUserId,
        action: "AI_IMAGE_ATTACHED",
        entityType: "PostDraft",
        entityId: post.id,
        detail: {
          mediaAssetId: asset.id,
          storageKey,
          fileSize: buffer.length,
          promptUsed: promptUsed?.slice(0, 200) ?? null,
        },
      },
    })
    .catch(() => {});

  return NextResponse.json({
    mediaAssetId: asset.id,
    storageUrl,
    sortOrder: nextSortOrder,
    fileSize: buffer.length,
  });
}
