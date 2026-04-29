/**
 * GET /api/posts/[postId]/approval-requests
 *
 * Devuelve el historial de ApprovalRequest del post, ordenado por createdAt
 * desc. Auth: requireSession (admin). Sólo se usa para refrescar el panel
 * en el detalle del post.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { postId: string } },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const post = await db.postDraft.findUnique({
    where: { id: params.postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const requests = await db.approvalRequest.findMany({
    where: { postDraftId: params.postId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      email: true,
      expiresAt: true,
      respondedAt: true,
      decision: true,
      feedback: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: requests });
}
