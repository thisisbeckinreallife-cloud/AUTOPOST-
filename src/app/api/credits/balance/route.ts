/**
 * GET /api/credits/balance
 * Devuelve el balance actual de créditos del AdminUser logueado:
 *   - monthly: del allotment del plan (caduca al ciclo)
 *   - addon: comprados (no caducan)
 *   - total: suma de ambos
 *   - resetAt: cuándo se resetea el monthly
 *   - plan: tier y config completa (allotment, features, etc.)
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getBalance } from "@/lib/ai/credits";
import { PLAN_CONFIGS } from "@/lib/ai/plan-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await getBalance(session.adminUserId);
  const user = await db.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: { plan: true, planExpiresAt: true },
  });
  const planConfig = user ? PLAN_CONFIGS[user.plan] : null;

  return NextResponse.json({
    balance,
    plan: user
      ? {
          tier: user.plan,
          displayName: planConfig?.displayName,
          priceUsdMonth: planConfig?.priceUsdMonth,
          monthlyAllotment: planConfig?.monthlyCredits,
          expiresAt: user.planExpiresAt,
        }
      : null,
  });
}
