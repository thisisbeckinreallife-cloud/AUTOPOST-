import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  step: z.number().int().min(1).max(5),
});

/**
 * POST /api/onboarding/step
 *
 * Avanza onboardingStep al valor recibido (sin completar). Idempotente:
 * si ya estás en un step >= al recibido, no retrocede.
 *
 * Lo usan los pasos 2, 3, 4 cuando el usuario completa una acción
 * (conectar red opcional, subir carpeta mock, revisar calendario).
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
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const user = await db.adminUser.findUnique({
      where: { id: session.adminUserId },
      select: { onboardingStep: true },
    });
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Solo avanzar nunca retroceder (evita race conditions con back/forward)
    const newStep = Math.max(user.onboardingStep, parsed.data.step);
    await db.adminUser.update({
      where: { id: session.adminUserId },
      data: { onboardingStep: newStep },
    });

    return NextResponse.json({ ok: true, step: newStep });
  } catch (err) {
    console.error("[Onboarding step]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
