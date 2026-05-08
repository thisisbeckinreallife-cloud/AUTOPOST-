/**
 * POST /api/stripe/checkout
 *
 * Crea una Checkout Session de Stripe con trial de 7 días sin tarjeta y
 * devuelve la URL al cliente. El cliente redirige por su cuenta — evitamos
 * 303 desde el server para que el toast de error pueda mostrarse si algo
 * falla.
 *
 * Decisiones de producto:
 *  - `payment_method_collection: "if_required"` → no pide tarjeta al
 *    iniciar. La pedirá al finalizar el trial vía email automático de
 *    Stripe (controla "automatic_payment_methods" en el dashboard).
 *  - `trial_period_days: 7` con `missing_payment_method: "cancel"` →
 *    si no se añade tarjeta antes de día 7, la suscripción se cancela
 *    sin riesgo de cargo.
 *  - `locale: "es"` → checkout en español, congruente con la landing.
 *  - `allow_promotion_codes: true` → cupones para campañas (Black Friday,
 *    rebrand, etc.).
 *  - Idempotency-Key derivada de userId+price+timestamp truncado a minuto:
 *    impide dobles clicks del usuario sin requerir más estado en cliente.
 *
 * Errores:
 *  - 401 si no hay sesión.
 *  - 400 si tier/period inválidos.
 *  - 503 si Stripe no está configurado (env vars vacías).
 *  - 500 para fallos inesperados, sin filtrar mensaje de Stripe al cliente.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getStripe,
  getPriceId,
  getOrCreateCustomer,
  isStripeConfigured,
  type CheckoutTier,
  type CheckoutPeriod,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TIERS: readonly CheckoutTier[] = ["basic", "pro", "agency"];
const VALID_PERIODS: readonly CheckoutPeriod[] = ["weekly", "yearly"];

interface CheckoutBody {
  tier?: string;
  period?: string;
}

function isValidTier(t: unknown): t is CheckoutTier {
  return typeof t === "string" && (VALID_TIERS as readonly string[]).includes(t);
}

function isValidPeriod(p: unknown): p is CheckoutPeriod {
  return typeof p === "string" && (VALID_PERIODS as readonly string[]).includes(p);
}

export async function POST(request: NextRequest) {
  // 1) Stripe debe estar configurado.
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error: "STRIPE_NOT_CONFIGURED",
        message: "Stripe aún no está disponible. Vuelve más tarde.",
      },
      { status: 503 }
    );
  }

  // 2) Sesión obligatoria.
  const session = await getSession();
  if (!session.isLoggedIn || !session.adminUserId) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Inicia sesión antes de suscribirte." },
      { status: 401 }
    );
  }

  // 3) Validación del body.
  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "JSON inválido." },
      { status: 400 }
    );
  }

  const { tier, period } = body;
  if (!isValidTier(tier) || !isValidPeriod(period)) {
    return NextResponse.json(
      {
        error: "INVALID_PARAMS",
        message: "tier o period inválido.",
        details: { tier, period },
      },
      { status: 400 }
    );
  }

  // 4) Carga del usuario.
  const user = await db.adminUser.findUnique({
    where: { id: session.adminUserId },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
      plan: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "USER_NOT_FOUND", message: "Tu cuenta no existe ya." },
      { status: 404 }
    );
  }

  try {
    const stripe = getStripe();
    const priceId = getPriceId(tier, period);
    const customerId = await getOrCreateCustomer(user.id, user.email, user.name);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";

    // Idempotency key: protege contra doble click. Granularidad por minuto
    // — si el user reintenta tras un fallo a los 90s, crea sesión nueva.
    const minuteBucket = Math.floor(Date.now() / 60_000);
    const idempotencyKey = `checkout_${user.id}_${priceId}_${minuteBucket}`;

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        locale: "es",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        payment_method_collection: "if_required",
        subscription_data: {
          trial_period_days: 7,
          trial_settings: {
            end_behavior: { missing_payment_method: "cancel" },
          },
          metadata: {
            adminUserId: user.id,
            tier,
            period,
          },
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing/cancel`,
        client_reference_id: user.id,
        metadata: {
          adminUserId: user.id,
          tier,
          period,
        },
      },
      { idempotencyKey }
    );

    if (!checkoutSession.url) {
      throw new Error("Checkout session creada sin URL");
    }

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (err) {
    // Logging server-side, sin filtrar el mensaje de Stripe al cliente.
    console.error("[stripe/checkout] error", {
      userId: user.id,
      tier,
      period,
      error: err instanceof Error ? err.message : String(err),
    });

    return NextResponse.json(
      {
        error: "CHECKOUT_FAILED",
        message:
          "No pudimos crear la sesión de pago. Vuelve a intentarlo en unos segundos.",
      },
      { status: 500 }
    );
  }
}
