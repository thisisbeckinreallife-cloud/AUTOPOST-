/**
 * POST /api/approval/[token]/respond
 *
 * Endpoint público (sin auth) que recibe la decisión del cliente sobre un
 * post pendiente de aprobación. Validado contra la tabla ApprovalRequest.
 *
 * Body:
 *   { decision: "APPROVED" | "REJECTED", feedback?: string }
 *
 * Reglas:
 *   - El token debe existir y no haber expirado.
 *   - El token sólo se puede usar una vez (respondedAt debe ser null).
 *   - Tras una decisión, el PostDraft.approvalStatus se actualiza a la decisión
 *     correspondiente.
 *   - REJECTED guarda feedback en PostDraft.rejectionReason.
 *   - APPROVED limpia rejectionReason y deja el post listo para publicarse.
 *   - Audit log con la IP y user-agent del cliente.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  feedback: z.string().max(1000).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  // Validate token format (base64url 43 chars from randomBytes(32))
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(params.token)) {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 });
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

  const approval = await db.approvalRequest.findUnique({
    where: { token: params.token },
    include: {
      postDraft: { select: { id: true, status: true, businessId: true } },
    },
  });

  if (!approval) {
    return NextResponse.json(
      { error: "Enlace no encontrado o ya invalidado" },
      { status: 404 },
    );
  }

  if (approval.respondedAt) {
    return NextResponse.json(
      { error: "Este enlace ya fue usado", decision: approval.decision },
      { status: 410 },
    );
  }

  if (approval.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "El enlace ha expirado" },
      { status: 410 },
    );
  }

  // Capturar IP + user-agent para auditoría.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;

  const updates =
    parsed.data.decision === "APPROVED"
      ? {
          approvalStatus: "APPROVED" as const,
          approvedAt: new Date(),
          rejectionReason: null,
        }
      : {
          approvalStatus: "REJECTED" as const,
          rejectedAt: new Date(),
          rejectionReason: parsed.data.feedback ?? null,
        };

  await db.$transaction(async (tx) => {
    await tx.approvalRequest.update({
      where: { id: approval.id },
      data: {
        respondedAt: new Date(),
        decision: parsed.data.decision,
        feedback: parsed.data.feedback ?? null,
        ipAddress: ip,
        userAgent: ua,
      },
    });
    await tx.postDraft.update({
      where: { id: approval.postDraftId },
      data: updates,
    });
    await tx.auditLog.create({
      data: {
        businessId: approval.postDraft.businessId,
        action: `APPROVAL_${parsed.data.decision}`,
        entityType: "PostDraft",
        entityId: approval.postDraftId,
        detail: {
          email: approval.email,
          ip,
          ua,
          feedback: parsed.data.feedback ?? null,
        },
        ipAddress: ip,
      },
    });
  });

  return NextResponse.json({
    decision: parsed.data.decision,
    respondedAt: new Date().toISOString(),
  });
}
