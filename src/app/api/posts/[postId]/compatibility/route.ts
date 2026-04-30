/**
 * GET /api/posts/[postId]/compatibility
 *
 * Devuelve un análisis de compatibilidad de formato para cada plataforma
 * social. La UI lo usa en post detail para mostrar warnings inline:
 *   - Plataformas recomendadas
 *   - Plataformas que tienen problemas (warnings/blockers)
 *   - Recomendaciones específicas (recortar, reformatear, etc.)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { analyzePostCompatibility } from "@/lib/social/format-rules";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { postId: string } },
) {
  try {
    await requireSession();

    const draft = await db.postDraft.findUnique({
      where: { id: params.postId },
      include: { mediaAssets: true },
    });
    if (!draft) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const reports = analyzePostCompatibility({
      postType: draft.postType,
      caption: draft.caption,
      hasCaption: draft.caption.length > 0,
      mediaAssets: draft.mediaAssets.map((m) => ({
        mimeType: m.mimeType,
        width: m.width,
        height: m.height,
        durationSec: m.durationSec,
        fileSize: m.fileSize,
      })),
    });

    return NextResponse.json({ data: reports });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
