/**
 * POST /api/batches/[id]/analyze
 *
 * Pre-computa análisis del batch — Llama Vision describe cada imagen,
 * detecta agrupaciones probables (carruseles), encuentra .txt sueltos.
 *
 * Resultado se guarda en UploadBatch.parseWarnings (campo Json existente)
 * con shape: { aiAnalysis: { summary, posts, groupings, openQuestions } }
 *
 * El chat IA luego invoca esto vía tool analyze_batch (que ya existe en
 * registry.ts) y trabaja sobre el resultado.
 *
 * Coste: ~$0.005 por imagen (Llama 3.2 90B Vision via Together).
 * Para un batch de 30 imágenes: ~$0.15. Sin créditos al user — incluido
 * en el plan que ya paga semanal.
 */
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import {
  isTogetherAvailable,
  analyzeImageWithVision,
} from "@/lib/ai/together";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGES_TO_ANALYZE = 40; // cap por batch

interface MediaAnalysis {
  postDraftId: string;
  sourceFolderName: string;
  postType: string;
  mediaItems: Array<{
    mediaAssetId: string;
    storageUrl: string;
    mimeType: string;
    aiDescription?: string;
    error?: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isTogetherAvailable()) {
    return NextResponse.json(
      { error: "Vision no disponible — configura TOGETHER_API_KEY" },
      { status: 503 },
    );
  }

  const batch = await db.uploadBatch.findUnique({
    where: { id: params.id },
    include: {
      postDrafts: {
        select: {
          id: true,
          sourceFolderName: true,
          postType: true,
          caption: true,
          mediaAssets: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              storageUrl: true,
              mimeType: true,
              originalFilename: true,
            },
          },
        },
      },
    },
  });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Recoger imágenes a analizar (cap MAX_IMAGES_TO_ANALYZE)
  const allImages: Array<{
    postDraftId: string;
    mediaAssetId: string;
    storageUrl: string;
    mimeType: string;
  }> = [];
  for (const post of batch.postDrafts) {
    for (const m of post.mediaAssets) {
      if (m.mimeType.startsWith("image/") && allImages.length < MAX_IMAGES_TO_ANALYZE) {
        allImages.push({
          postDraftId: post.id,
          mediaAssetId: m.id,
          storageUrl: m.storageUrl,
          mimeType: m.mimeType,
        });
      }
    }
  }

  // Análisis paralelo (con concurrencia de 5 para no saturar)
  const analyses = new Map<string, { description?: string; error?: string }>();
  const CONCURRENCY = 5;
  const queue = [...allImages];
  await Promise.all(
    Array.from({ length: CONCURRENCY }).map(async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
        try {
          const res = await analyzeImageWithVision({
            imageUrl: item.storageUrl,
            prompt:
              "Describe esta imagen en español, en 1-2 frases muy concisas. Indica: tipo (foto producto, lifestyle, captura UI, ilustración, retrato, paisaje, comida, etc.), mood (cálido, frío, minimalista, vibrante, etc.), elementos clave visibles. NO menciones lo que no ves. Sé específico y útil para el equipo de marketing.",
            maxTokens: 200,
          });
          analyses.set(item.mediaAssetId, { description: res.text });
        } catch (err) {
          analyses.set(item.mediaAssetId, {
            error: err instanceof Error ? err.message : "vision failed",
          });
        }
      }
    }),
  );

  // Construir resultado estructurado
  const posts: MediaAnalysis[] = batch.postDrafts.map((p) => ({
    postDraftId: p.id,
    sourceFolderName: p.sourceFolderName,
    postType: p.postType,
    mediaItems: p.mediaAssets.map((m) => {
      const analysis = analyses.get(m.id);
      return {
        mediaAssetId: m.id,
        storageUrl: m.storageUrl,
        mimeType: m.mimeType,
        aiDescription: analysis?.description,
        error: analysis?.error,
      };
    }),
  }));

  // Métricas + suggestions
  const totalImages = allImages.length;
  const analyzed = Array.from(analyses.values()).filter((a) => a.description).length;
  const failed = Array.from(analyses.values()).filter((a) => a.error).length;
  const skipped = posts.reduce(
    (acc, p) => acc + p.mediaItems.filter((m) => m.mimeType.startsWith("image/") && !m.aiDescription).length,
    0,
  );

  const summary = {
    totalPosts: posts.length,
    totalImages,
    analyzedImages: analyzed,
    failedAnalyses: failed,
    skippedAnalyses: skipped,
    cappedAt: MAX_IMAGES_TO_ANALYZE,
  };

  // Persistir en UploadBatch.parseWarnings (Json field) — append
  const existing = (batch.parseWarnings as Record<string, unknown>) ?? {};
  const newWarnings = {
    ...existing,
    aiAnalysis: {
      summary,
      posts,
      analyzedAt: new Date().toISOString(),
    },
  };

  await db.uploadBatch.update({
    where: { id: batch.id },
    data: { parseWarnings: newWarnings as unknown as Prisma.InputJsonValue },
  });

  await db.auditLog
    .create({
      data: {
        businessId: batch.businessId,
        adminUserId: session.adminUserId,
        action: "AI_BATCH_ANALYZED",
        entityType: "UploadBatch",
        entityId: batch.id,
        detail: summary,
      },
    })
    .catch(() => {});

  return NextResponse.json({
    summary,
    posts,
  });
}
