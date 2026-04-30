/**
 * POST /api/batches/[batchId]/regroup
 *
 * Re-agrupa los PostDrafts de un batch usando OpenAI Vision (gpt-4o-mini).
 * Útil cuando la heurística inicial agrupó mal:
 *   - Imágenes que pertenecen a un mismo carrusel quedaron como posts separados
 *   - O imágenes de diferentes campañas se metieron en un mismo carrusel
 *
 * El endpoint:
 *   1. Recoge todas las imágenes del batch (cualquier post draft con status DRAFT/VALIDATED/READY)
 *   2. Llama a Vision para que sugiera grupos basados en coherencia visual
 *   3. Crea NUEVOS PostDrafts con los grupos propuestos
 *   4. Marca los antiguos como CANCELLED
 *   5. Devuelve el resumen para que el chat IA lo cuente al user
 *
 * Solo se ejecuta si el chat IA lo invoca explícitamente (vía tool
 * regroup_batch_with_ai). Cuesta ~$0.005-0.015 por ejecución.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { groupWithVision } from "@/services/parser/smart-grouper";
import { v4 as uuidv4 } from "uuid";
import { hashSHA256 } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: { batchId: string } },
) {
  try {
    await requireSession();

    const batch = await db.uploadBatch.findUnique({
      where: { id: params.batchId },
      include: {
        postDrafts: {
          where: { status: { in: ["DRAFT", "VALIDATED", "READY"] } },
          include: { mediaAssets: true },
        },
      },
    });
    if (!batch) {
      return NextResponse.json({ error: "Batch no encontrado" }, { status: 404 });
    }

    // Recoger todas las imágenes (no videos — los videos siempre = REELs)
    const images = batch.postDrafts
      .flatMap((d) => d.mediaAssets.map((m) => ({ draft: d, asset: m })))
      .filter(({ asset }) => asset.mimeType.startsWith("image/"));

    if (images.length === 0) {
      return NextResponse.json(
        {
          data: {
            regrouped: 0,
            message: "No hay imágenes para reagrupar (solo videos en este batch).",
          },
        },
        { status: 200 },
      );
    }

    if (images.length > 20) {
      return NextResponse.json(
        {
          error: `El batch tiene ${images.length} imágenes — máximo 20 para reagrupamiento con IA. Sube en lotes más pequeños.`,
        },
        { status: 400 },
      );
    }

    // Llamar a Vision para que agrupe
    const visionResult = await groupWithVision({
      images: images.map(({ asset }) => ({
        url: asset.storageUrl,
        filename: asset.originalFilename,
      })),
    });

    if (visionResult.groups.length === 0) {
      return NextResponse.json(
        {
          data: {
            regrouped: 0,
            warnings: visionResult.warnings,
            message: "Vision no propuso ningún reagrupamiento — los grupos actuales se mantienen.",
          },
        },
        { status: 200 },
      );
    }

    // Mapa rápido filename → asset
    const assetByFilename = new Map(
      images.map(({ asset, draft }) => [
        asset.originalFilename,
        { asset, draft },
      ]),
    );

    // Crear nuevos PostDrafts
    const newDrafts: Array<{
      id: string;
      filenames: string[];
      type: string;
      groupKey: string;
      reason: string;
      captionDraft?: string;
    }> = [];
    const draftsToCancel = new Set<string>();

    for (const group of visionResult.groups) {
      const groupAssets = group.filenames
        .map((fn) => assetByFilename.get(fn))
        .filter((x): x is NonNullable<typeof x> => !!x);

      if (groupAssets.length === 0) continue;

      // Marcar los drafts originales como cancelled (los reemplazamos)
      for (const { draft } of groupAssets) {
        draftsToCancel.add(draft.id);
      }

      // Re-detectar tipo basado en el grupo
      const detectedType =
        groupAssets.length === 1 ? "IMAGE" : group.detectedType === "carousel" ? "CAROUSEL" : "IMAGE";

      // Crear nuevo draft que reúne las imágenes del grupo
      const newDraftId = uuidv4();
      const caption = group.captionDraft ?? "";

      // contentHash basado en los assets
      const sortedHashes = groupAssets
        .map(({ asset }) => asset.fileHash)
        .sort()
        .join("|");
      const contentHash = hashSHA256(`${caption}|${sortedHashes}`);

      // publishAt: heredamos del primer draft del grupo
      const publishAt = groupAssets[0].draft.publishAt;
      const timezone = groupAssets[0].draft.timezone;

      await db.postDraft.create({
        data: {
          id: newDraftId,
          businessId: batch.businessId,
          batchId: batch.id,
          postType: detectedType as "IMAGE" | "CAROUSEL" | "REEL",
          publishAt,
          timezone,
          caption,
          captionHash: hashSHA256(caption),
          contentHash,
          idempotencyKey: uuidv4(),
          status: "VALIDATED",
          sourceFolderName: group.groupKey,
          mediaAssets: {
            create: groupAssets.map(({ asset }, i) => ({
              originalFilename: asset.originalFilename,
              storagePath: asset.storagePath,
              storageUrl: asset.storageUrl,
              mimeType: asset.mimeType,
              fileSize: asset.fileSize,
              fileHash: asset.fileHash,
              width: asset.width,
              height: asset.height,
              durationSec: asset.durationSec,
              sortOrder: i,
            })),
          },
        },
      });

      newDrafts.push({
        id: newDraftId,
        filenames: group.filenames,
        type: detectedType,
        groupKey: group.groupKey,
        reason: group.reason,
        captionDraft: group.captionDraft,
      });
    }

    // Cancelar los drafts antiguos
    if (draftsToCancel.size > 0) {
      await db.postDraft.updateMany({
        where: { id: { in: Array.from(draftsToCancel) } },
        data: { status: "CANCELLED", lastError: "Reemplazado por reagrupamiento IA" },
      });
    }

    // Audit log
    await db.auditLog
      .create({
        data: {
          businessId: batch.businessId,
          action: "BATCH_REGROUPED",
          entityType: "UploadBatch",
          entityId: batch.id,
          detail: {
            oldDrafts: Array.from(draftsToCancel),
            newDrafts: newDrafts.map((d) => d.id),
            visionWarnings: visionResult.warnings,
          },
        },
      })
      .catch(() => {});

    return NextResponse.json({
      data: {
        regrouped: newDrafts.length,
        cancelled: draftsToCancel.size,
        warnings: visionResult.warnings,
        groups: newDrafts,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[regroup] error:", msg, err);
    return NextResponse.json(
      { error: `Error reagrupando: ${msg}` },
      { status: 500 },
    );
  }
}
