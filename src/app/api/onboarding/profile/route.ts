import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2).max(80).optional(),
  businessName: z.string().min(2).max(120),
  businessType: z.string().min(2).max(60),
});

/**
 * POST /api/onboarding/profile
 *
 * Paso 1 del wizard: guarda nombre del usuario, nombre del negocio y
 * sector. Avanza el step a 2.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.adminUserId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await db.adminUser.update({
      where: { id: session.adminUserId },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        businessName: parsed.data.businessName,
        businessType: parsed.data.businessType,
        onboardingStep: 2,
      },
    });

    return NextResponse.json({ ok: true, nextStep: 2 });
  } catch (err) {
    console.error("[Onboarding profile]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
