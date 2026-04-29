/**
 * GET /api/credits/history?limit=50
 * Historial de generaciones IA y compras de packs del usuario.
 * Combinado en un único feed cronológico para el panel /credits.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.min(200, Math.max(1, Number(limitParam) || 50));

  const [generations, purchases] = await Promise.all([
    db.aiGeneration.findMany({
      where: { adminUserId: session.adminUserId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        creditsCost: true,
        source: true,
        provider: true,
        model: true,
        refunded: true,
        createdAt: true,
        businessId: true,
      },
    }),
    db.creditPurchase.findMany({
      where: { adminUserId: session.adminUserId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        pack: true,
        credits: true,
        amountUsd: true,
        status: true,
        createdAt: true,
        paidAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    generations,
    purchases,
  });
}
