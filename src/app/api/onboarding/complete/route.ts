import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

/**
 * POST /api/onboarding/complete
 *
 * Marca onboardingCompleted = true y onboardingStep = 5. Después
 * el middleware del dashboard ya no redirige a /onboarding.
 *
 * Lo llama el paso 5 ("¡Listo!") al hacer click en "Ir al panel".
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.adminUserId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    await db.adminUser.update({
      where: { id: session.adminUserId },
      data: {
        onboardingCompleted: true,
        onboardingStep: 5,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Onboarding complete]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
