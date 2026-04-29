/**
 * POST /api/posts/[postId]/request-approval
 *
 * Genera un magic-link de aprobación y lo envía por email al cliente.
 * Auth: requireSession (admin).
 *
 * Body:
 *   {
 *     email: string,             // destinatario
 *     expiresHours?: number,     // default 72
 *     message?: string,          // mensaje extra opcional al cliente
 *   }
 *
 * Side effects:
 *   - Crea ApprovalRequest en DB con token único.
 *   - Marca PostDraft.approvalStatus = "PENDING_APPROVAL".
 *   - Envía email editorial con enlace a /aprobar/[token].
 *   - Audit log AI_APPROVAL_REQUESTED.
 *
 * Response 200:
 *   { id, expiresAt, emailSent: boolean }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { sendEmail, approvalRequestEmailHtml } from "@/lib/email";

const bodySchema = z.object({
  email: z.string().email().max(200),
  expiresHours: z.number().int().min(1).max(168).default(72),
  message: z.string().max(500).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { email, expiresHours } = parsed.data;

  const post = await db.postDraft.findUnique({
    where: { id: params.postId },
    include: {
      business: { select: { name: true, timezone: true } },
      mediaAssets: { select: { id: true } },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Sólo posts no publicados pueden pedirse en aprobación.
  if (
    !["DRAFT", "VALIDATED", "READY", "SCHEDULED"].includes(post.status) ||
    post.approvalStatus === "REJECTED"
  ) {
    return NextResponse.json(
      {
        error: `No se puede solicitar aprobación en estado "${post.status}/${post.approvalStatus}"`,
      },
      { status: 409 },
    );
  }

  // Generar token criptográficamente seguro (43 chars base64url).
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

  const approval = await db.$transaction(async (tx) => {
    const ap = await tx.approvalRequest.create({
      data: {
        postDraftId: post.id,
        token,
        email,
        expiresAt,
        createdByAdminUserId: session.adminUserId,
      },
    });
    await tx.postDraft.update({
      where: { id: post.id },
      data: { approvalStatus: "PENDING_APPROVAL" },
    });
    await tx.auditLog.create({
      data: {
        businessId: post.businessId,
        adminUserId: session.adminUserId,
        action: "APPROVAL_REQUESTED",
        entityType: "PostDraft",
        entityId: post.id,
        detail: {
          email,
          expiresAt: expiresAt.toISOString(),
          tokenPrefix: token.slice(0, 8),
        },
      },
    });
    return ap;
  });

  // Construir URL pública.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopost.app";
  const approvalUrl = `${baseUrl.replace(/\/$/, "")}/aprobar/${token}`;

  // Formatear fecha programada en timezone del negocio.
  const scheduledFor = post.publishAt.toLocaleString("es-ES", {
    timeZone: post.business.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Enviar email — sendEmail no lanza si falla.
  let emailSent = false;
  try {
    await sendEmail(
      email,
      `Aprobación solicitada · ${post.business.name}`,
      approvalRequestEmailHtml({
        businessName: post.business.name,
        approvalUrl,
        postType: post.postType,
        scheduledFor,
        expiresInHours: expiresHours,
        captionExcerpt: post.caption.slice(0, 600),
        mediaCount: post.mediaAssets.length,
      }),
    );
    emailSent = true;
  } catch (err) {
    console.error("[request-approval] email failed:", err);
  }

  return NextResponse.json({
    id: approval.id,
    expiresAt: approval.expiresAt,
    emailSent,
    // Devolvemos la URL para que el admin pueda copiarla manualmente
    // si el SMTP no está configurado en local.
    approvalUrl: process.env.SMTP_HOST ? undefined : approvalUrl,
  });
}
