/**
 * GET /api/ai/chat/recent?businessId=X
 *
 * Devuelve el chat MÁS reciente del business cuyo último update sea de
 * hace menos de 3 horas. Si no hay chat activo, devuelve { data: null }.
 *
 * Esto permite que el cliente restaure la conversación cuando el user
 * vuelve a /chat tras navegar a otras pestañas (Calendario, Settings...).
 *
 * Pasadas las 3 horas, el chat se considera abandonado y se ignora
 * (lo borrará el cleanup task del worker).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_TTL_MS = 3 * 60 * 60 * 1000; // 3 horas

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = request.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
  }

  // Verificar ownership del business (a través del adminUser)
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business no encontrado" }, { status: 404 });
  }

  const cutoff = new Date(Date.now() - SESSION_TTL_MS);

  const chat = await db.aiChat.findFirst({
    where: {
      adminUserId: session.adminUserId,
      businessId,
      updatedAt: { gte: cutoff },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          toolCalls: true,
          createdAt: true,
        },
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt.toISOString(),
      messages: chat.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt.toISOString(),
      })),
    },
  });
}
