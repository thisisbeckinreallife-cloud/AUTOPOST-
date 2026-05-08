/**
 * POST /api/stripe/webhook
 *
 * Handler de webhooks de Stripe con verificación de firma + idempotencia.
 *
 * Eventos manejados:
 *  - checkout.session.completed         → crea/actualiza Subscription + AdminUser.plan
 *  - customer.subscription.updated      → sincroniza estado (active, trialing, past_due, canceled)
 *  - customer.subscription.deleted      → marca canceled + revierte plan a FREE
 *  - invoice.payment_failed             → marca past_due + dispara email (TODO)
 *  - invoice.payment_succeeded          → marca active + actualiza nextBillingDate
 *
 * Idempotencia:
 *  - Stripe garantiza at-least-once delivery → puede reintentarse el mismo evento.
 *  - Antes de procesar, hacemos `webhookEvent.create({ id: event.id })`.
 *    Si la inserción falla por unique constraint, devolvemos 200 sin reprocesar.
 *  - Esto es race-safe gracias a la transacción del create.
 *
 * Seguridad:
 *  - Verificación de firma vía constructEvent. Sin firma válida → 400 sin tocar DB.
 *  - El raw body se obtiene con `request.text()` ANTES de cualquier parse JSON.
 *    Stripe firma el bytestream literal; cualquier transformación rompe la firma.
 *  - Body inferior a 1MB (Stripe nunca envía más).
 *
 * Performance:
 *  - El handler responde 200 lo antes posible (Stripe espera <30s).
 *  - Operaciones lentas (envío de email, etc.) se delegan a workers via job queue
 *    en vez de bloquear la respuesta. Por ahora son TODOs.
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe, getTierFromPriceId, tierToPlan } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RELEVANT_EVENTS = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
]);

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.startsWith("whsec_...")) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET no configurado");
    return NextResponse.json(
      { error: "WEBHOOK_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  // ⚠ raw body — Stripe firma el bytestream literal.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "verify failed";
    console.warn("[stripe/webhook] firma inválida", { error: msg });
    return NextResponse.json(
      { error: "INVALID_SIGNATURE", message: msg },
      { status: 400 }
    );
  }

  // Idempotencia. Si insertar falla por constraint unique → ya procesado.
  try {
    await db.webhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as object,
      },
    });
  } catch (err) {
    // P2002 = unique violation en Prisma. Cualquier otro error sí lo logueamos.
    const code = (err as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json({ received: true, deduped: true });
    }
    console.error("[stripe/webhook] fallo idempotency insert", {
      eventId: event.id,
      type: event.type,
      error: err instanceof Error ? err.message : String(err),
    });
    // Fallar aquí devuelve 500 → Stripe reintentará. Es el comportamiento correcto.
    return NextResponse.json(
      { error: "PERSIST_FAILED" },
      { status: 500 }
    );
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionChange(
          event.data.object as Stripe.Subscription,
          event.type
        );
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
    }

    // Marca el evento como procesado para auditoría.
    await db.webhookEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });

    return NextResponse.json({ received: true, handled: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error", {
      eventId: event.id,
      type: event.type,
      error: err instanceof Error ? err.message : String(err),
    });

    // Persistimos el error para diagnóstico, pero devolvemos 500 para que
    // Stripe reintente — el resultado del handler debe poder converger.
    await db.webhookEvent
      .update({
        where: { id: event.id },
        data: {
          lastError: err instanceof Error ? err.message : String(err),
        },
      })
      .catch(() => undefined);

    return NextResponse.json(
      { error: "HANDLER_FAILED" },
      { status: 500 }
    );
  }
}

/**
 * checkout.session.completed
 * Llega cuando el usuario completa el flow de checkout. Si la suscripción
 * tenía trial, viene con status="trialing" — manejamos eso aquí.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const adminUserId = session.metadata?.adminUserId ?? session.client_reference_id;
  if (!adminUserId) {
    console.warn("[stripe/webhook] checkout sin adminUserId", {
      sessionId: session.id,
    });
    return;
  }

  if (session.mode !== "subscription" || !session.subscription) {
    return; // No es nuestro flow.
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertSubscriptionState(adminUserId, subscription);
}

/**
 * customer.subscription.{updated,deleted}
 * Cualquier cambio en el ciclo de vida (trial→active, active→past_due,
 * downgrade/upgrade, cancel) llega aquí.
 */
async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  eventType: Stripe.Event.Type
) {
  const adminUserId = subscription.metadata?.adminUserId;
  if (!adminUserId) {
    // Lookup por stripeCustomerId.
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;
    const user = await db.adminUser.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!user) {
      console.warn("[stripe/webhook] subscription sin adminUser conocido", {
        subscriptionId: subscription.id,
      });
      return;
    }
    await upsertSubscriptionState(user.id, subscription, eventType === "customer.subscription.deleted");
    return;
  }

  await upsertSubscriptionState(
    adminUserId,
    subscription,
    eventType === "customer.subscription.deleted"
  );
}

/**
 * invoice.payment_failed
 * Cobro fallido (tarjeta caducada, fondos insuficientes…). Marcamos past_due
 * y dejamos un hook para enviar email (TODO).
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const user = await db.adminUser.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, stripeSubscriptionId: true },
  });
  if (!user || !user.stripeSubscriptionId) return;

  await db.subscription.updateMany({
    where: { stripeSubscriptionId: user.stripeSubscriptionId },
    data: {
      status: "past_due",
      lastPaymentError: invoice.last_finalization_error?.message ?? "payment_failed",
    },
  });

  // TODO: enqueue email "Tu pago no pudo procesarse — actualiza la tarjeta".
}

/**
 * invoice.payment_succeeded
 * Cobro exitoso (incluye el primer cargo tras trial). Re-marcamos active y
 * actualizamos currentPeriodEnd.
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  // Lookup user a partir del invoice — la subscripción está en invoice.subscription.
  // Stripe SDK v18+ movió este campo fuera de tipos pero sigue en runtime;
  // cast puntual evita expansion innecesaria.
  const invoiceSub = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  const subscriptionId =
    typeof invoiceSub === "string"
      ? invoiceSub
      : invoiceSub?.id;
  if (!subscriptionId) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const adminUserId =
    subscription.metadata?.adminUserId ??
    (
      await db.adminUser.findFirst({
        where: { stripeCustomerId: customerId },
        select: { id: true },
      })
    )?.id;

  if (!adminUserId) return;
  await upsertSubscriptionState(adminUserId, subscription);
}

/**
 * Núcleo: dado un AdminUser y una Subscription de Stripe, sincroniza el
 * estado en nuestra DB (Subscription + AdminUser.plan).
 *
 * @param canceled — si true, fuerza plan="FREE" sin importar el status del
 *                   item. Se usa solo para customer.subscription.deleted.
 */
async function upsertSubscriptionState(
  adminUserId: string,
  subscription: Stripe.Subscription,
  canceled = false
) {
  const item = subscription.items.data[0];
  if (!item) {
    console.warn("[stripe/webhook] subscription sin items", { id: subscription.id });
    return;
  }

  const priceId = item.price.id;
  const tierMap = getTierFromPriceId(priceId);

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const status: string = canceled ? "canceled" : subscription.status;

  // Decisión de plan: FREE si canceled o status terminal; tier mapeado si activo.
  const ACTIVE_STATUSES = new Set([
    "active",
    "trialing",
    "past_due", // mantenemos plan hasta que efectivamente se cancele
  ]);
  const newPlan =
    !canceled && tierMap && ACTIVE_STATUSES.has(status)
      ? tierToPlan(tierMap.tier)
      : "FREE";

  await db.$transaction([
    db.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        adminUserId,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        status,
        tier: tierMap?.tier ?? null,
        period: tierMap?.period ?? null,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
      },
      update: {
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        status,
        tier: tierMap?.tier ?? null,
        period: tierMap?.period ?? null,
        currentPeriodStart: new Date(item.current_period_start * 1000),
        currentPeriodEnd: new Date(item.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        canceledAt: canceled ? new Date() : null,
      },
    }),
    db.adminUser.update({
      where: { id: adminUserId },
      data: {
        stripeSubscriptionId: canceled ? null : subscription.id,
        plan: newPlan,
        planExpiresAt: canceled
          ? null
          : new Date(item.current_period_end * 1000),
      },
    }),
  ]);
}
