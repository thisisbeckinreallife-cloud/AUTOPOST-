/**
 * /api/stripe/portal
 *
 * POST → crea una Stripe Billing Portal session y devuelve la URL para
 *        redirigir al usuario. El portal de Stripe permite al usuario
 *        cambiar de plan, actualizar tarjeta, ver facturas, cancelar.
 *
 * El portal se configura una sola vez en Stripe Dashboard → Settings →
 * Billing → Customer portal. Allí se decide qué features están disponibles.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const user = await db.adminUser.findUnique({
      where: { id: session.adminUserId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No tienes ninguna suscripción activa. Empieza una desde la página de precios." },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/account`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[/api/stripe/portal]", err);
    return NextResponse.json(
      { error: "No se pudo abrir el portal de facturación. Intenta de nuevo en un momento." },
      { status: 502 },
    );
  }
}
