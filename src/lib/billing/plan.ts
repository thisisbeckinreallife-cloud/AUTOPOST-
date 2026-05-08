/**
 * Billing · Plan helpers
 * ──────────────────────────────────────────────────────────────────────────
 * Mapeo entre plan legacy (`AdminUser.plan` enum-string FREE/SOLO/PRO/AGENCY)
 * y los tier nuevos (basic/pro/agency) de Stripe. Define qué features
 * desbloquea cada tier — fuente de verdad para gating server-side.
 *
 * Reglas:
 *  - FREE: usuarios sin suscripción activa o trial expirado → con watermark.
 *  - SOLO (legacy) / BASIC (nuevo): primer tier de pago → con watermark
 *    (incentivo para subir a Pro).
 *  - PRO / AGENCY: pagos de gama media+ → SIN watermark, gestión de equipo,
 *    integraciones avanzadas.
 *
 * El plan canónico vive en `AdminUser.plan` (lo escribe el webhook de
 * Stripe). Para `getEffectivePlan` también miramos `AdminUser.subscription`
 * por si el webhook llega tarde y AdminUser.plan está desactualizado.
 */

import type { AdminUser, Subscription } from "@prisma/client";

export type Tier = "FREE" | "BASIC" | "PRO" | "AGENCY";
export type StripeTier = "basic" | "pro" | "agency";

const LEGACY_PLAN_TO_TIER: Record<string, Tier> = {
  FREE: "FREE",
  SOLO: "BASIC", // alias legacy
  BASIC: "BASIC",
  PRO: "PRO",
  AGENCY: "AGENCY",
};

const STRIPE_TIER_TO_LEGACY: Record<StripeTier, Tier> = {
  basic: "BASIC",
  pro: "PRO",
  agency: "AGENCY",
};

/**
 * Devuelve el tier "efectivo" del usuario combinando plan legacy y subscripción
 * activa. Prefiere subscripción si existe Y está activa/trial; si no, usa
 * AdminUser.plan.
 */
export function getEffectiveTier(
  user: Pick<AdminUser, "plan">,
  subscription?: Pick<Subscription, "status" | "tier"> | null
): Tier {
  if (subscription && subscription.tier) {
    const ACTIVE = new Set(["active", "trialing", "past_due"]);
    if (ACTIVE.has(subscription.status)) {
      return STRIPE_TIER_TO_LEGACY[subscription.tier as StripeTier] ?? "FREE";
    }
  }
  return LEGACY_PLAN_TO_TIER[user.plan] ?? "FREE";
}

/**
 * Ranking de tiers para checks tipo "tier ≥ X".
 */
const TIER_RANK: Record<Tier, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  AGENCY: 3,
};

export function tierAtLeast(actual: Tier, minimum: Tier): boolean {
  return TIER_RANK[actual] >= TIER_RANK[minimum];
}

/**
 * Feature gates — fuente de verdad para qué puede hacer cada plan.
 */
export const FEATURES = {
  /** Si false, los posts llevan "Programado con autopost.app" al final. */
  canHideWatermark: (tier: Tier) => tierAtLeast(tier, "PRO"),

  /** Conexiones simultáneas a redes sociales. */
  maxAccounts: (tier: Tier): number => {
    switch (tier) {
      case "FREE": return 1;
      case "BASIC": return 1;
      case "PRO": return 3;
      case "AGENCY": return 10;
    }
  },

  /** Posts/mes permitidos antes de bloqueo. */
  postsPerMonth: (tier: Tier): number => {
    switch (tier) {
      case "FREE": return 10;
      case "BASIC": return 50;
      case "PRO": return 200;
      case "AGENCY": return Infinity;
    }
  },

  /** Equipo: número de usuarios admin en la org. */
  teamSize: (tier: Tier): number => {
    switch (tier) {
      case "FREE": return 1;
      case "BASIC": return 1;
      case "PRO": return 1;
      case "AGENCY": return 5;
    }
  },

  /** Soporte prioritario (queue distinta + SLA). */
  prioritySupport: (tier: Tier) => tierAtLeast(tier, "PRO"),

  /** Account manager dedicado (humano). */
  accountManager: (tier: Tier) => tier === "AGENCY",
};

/**
 * Etiqueta legible para UI (header de Settings, billing).
 * Localizable, prefiere "es" por defecto.
 */
export function tierLabel(tier: Tier, lang: "es" | "en" = "es"): string {
  const labels = {
    es: { FREE: "Plan Gratis", BASIC: "Plan Básico", PRO: "Plan Pro", AGENCY: "Plan Agency" },
    en: { FREE: "Free Plan",   BASIC: "Basic Plan",  PRO: "Pro Plan",  AGENCY: "Agency Plan" },
  };
  return labels[lang][tier];
}

/**
 * Precio semanal en euros del tier. 0 para FREE.
 */
export function tierPriceWeekly(tier: Tier): number {
  switch (tier) {
    case "FREE": return 0;
    case "BASIC": return 5;
    case "PRO": return 7;
    case "AGENCY": return 10;
  }
}
