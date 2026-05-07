/**
 * Stripe client + helpers compartidos entre /api/stripe/checkout y /api/stripe/webhook.
 *
 * Decisiones:
 *  - Singleton del cliente Stripe (evita reconexiones en hot-reload de Next.js).
 *  - apiVersion fijada explícitamente — protege contra breaking changes futuros
 *    cuando subamos el SDK.
 *  - getPriceId / getTierFromPriceId mantienen la matriz tier×period en un
 *    único sitio: añadir un nuevo precio = añadir una entrada al map.
 *  - getOrCreateCustomer es idempotente: reutiliza stripeCustomerId si ya
 *    existe en AdminUser, y solo crea cliente nuevo si falta.
 *
 * Sin `STRIPE_SECRET_KEY` configurada cualquier import lanza al primer uso —
 * los handlers que dependen de Stripe ya devuelven 503 antes de llegar aquí.
 */

import Stripe from "stripe";
import { db } from "@/lib/db";

export type CheckoutTier = "basic" | "pro" | "agency";
export type CheckoutPeriod = "weekly" | "yearly";

class StripeNotConfiguredError extends Error {
  code = "STRIPE_NOT_CONFIGURED";
  constructor(missing: string) {
    super(`Falta variable de entorno ${missing}. Configura Stripe en Railway.`);
    this.name = "StripeNotConfiguredError";
  }
}

let _stripe: Stripe | null = null;

/** Devuelve el cliente Stripe singleton. Lanza si no está configurado. */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_...") || key === "") {
    throw new StripeNotConfiguredError("STRIPE_SECRET_KEY");
  }

  _stripe = new Stripe(key, {
    // Pinnea la versión — bumpear conscientemente cuando se actualice el SDK.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: {
      name: "AUTOPOST",
      url: "https://autopost-production-cd57.up.railway.app",
    },
  });

  return _stripe;
}

/** Devuelve true si las env vars críticas de Stripe están presentes. */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_...") &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      !process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_...")
  );
}

/**
 * Mapeo tier × period → STRIPE_PRICE_* env var.
 * Mantén la nomenclatura sincronizada con .env.example.
 */
const PRICE_ENV_MAP: Record<CheckoutTier, Record<CheckoutPeriod, string>> = {
  basic: {
    weekly: "STRIPE_PRICE_BASIC_WEEKLY",
    yearly: "STRIPE_PRICE_BASIC_YEARLY",
  },
  pro: {
    weekly: "STRIPE_PRICE_PRO_WEEKLY",
    yearly: "STRIPE_PRICE_PRO_YEARLY",
  },
  agency: {
    weekly: "STRIPE_PRICE_AGENCY_WEEKLY",
    yearly: "STRIPE_PRICE_AGENCY_YEARLY",
  },
};

/**
 * Resuelve el price_id de Stripe para un tier+period dado.
 * Lanza si la env var falta — el handler debería devolver 503 limpio.
 */
export function getPriceId(tier: CheckoutTier, period: CheckoutPeriod): string {
  const envName = PRICE_ENV_MAP[tier]?.[period];
  if (!envName) {
    throw new Error(`Combinación inválida: tier=${tier}, period=${period}`);
  }
  const value = process.env[envName];
  if (!value) {
    throw new StripeNotConfiguredError(envName);
  }
  return value;
}

/**
 * Reverse lookup: dado un price_id, devuelve {tier, period}.
 * Útil en el webhook para mapear subscriptions a `plan` del AdminUser.
 * Devuelve null si el price_id no coincide con ninguno conocido — protege
 * contra prices de pruebas o legacy que el webhook puede recibir.
 */
export function getTierFromPriceId(
  priceId: string
): { tier: CheckoutTier; period: CheckoutPeriod } | null {
  for (const tier of Object.keys(PRICE_ENV_MAP) as CheckoutTier[]) {
    for (const period of Object.keys(PRICE_ENV_MAP[tier]) as CheckoutPeriod[]) {
      const envName = PRICE_ENV_MAP[tier][period];
      if (process.env[envName] === priceId) {
        return { tier, period };
      }
    }
  }
  return null;
}

/**
 * Mapeo CheckoutTier → string del campo `plan` en AdminUser.
 * El schema usa "FREE | SOLO | PRO | AGENCY"; mapeamos basic→SOLO.
 */
export function tierToPlan(tier: CheckoutTier): string {
  switch (tier) {
    case "basic":
      return "SOLO";
    case "pro":
      return "PRO";
    case "agency":
      return "AGENCY";
  }
}

/**
 * Devuelve el customer_id de Stripe para un AdminUser, creándolo si no existe.
 * Idempotente — seguro para llamarse en cada checkout.
 *
 * @param userId — id del AdminUser
 * @param email — email del usuario (se usa para crear el customer)
 * @param name — nombre opcional para el customer
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const user = await db.adminUser.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user) {
    throw new Error(`AdminUser no encontrado: ${userId}`);
  }

  if (user.stripeCustomerId) {
    // Sanity check — si el customer fue borrado en Stripe, se creará uno nuevo.
    try {
      const stripe = getStripe();
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existing && !("deleted" in existing && existing.deleted)) {
        return user.stripeCustomerId;
      }
    } catch {
      // Cae al path de creación abajo si retrieve falla.
    }
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: {
      adminUserId: userId,
    },
  });

  await db.adminUser.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
