/**
 * Sistema de créditos IA — consumeCredit, getBalance, refundCredit, resetMonthly.
 *
 * Política:
 *   1. Verificar plan no expirado.
 *   2. Si aiCreditsResetAt vencido → resetear allotment del plan tier actual.
 *   3. Restar primero del bucket mensual (caduca al ciclo).
 *   4. Si mensual no alcanza, restar del addon (no caduca).
 *   5. Si total no alcanza → 402 con info de paquetes disponibles.
 *   6. Crear registro AiGeneration con detalles para audit + analytics.
 *
 * Idempotencia: la transacción atómica vía db.$transaction garantiza que
 * descuento + AiGeneration ocurren juntos o ninguno. Si la llamada a la API
 * de IA falla DESPUÉS, llamar refundCredit(generationId) para restituir.
 */
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  PLAN_CONFIGS,
  CREDIT_COST,
  REAL_COST_USD,
  ADDON_PACKS,
  type AiActionType,
} from "@/lib/ai/plan-config";

export interface ConsumeInput {
  adminUserId: string;
  action: AiActionType;
  businessId?: string;
  /** Override del coste por defecto (ej: si el chat IA agrupa varias acciones). */
  costOverride?: number;
  /** Provider real para tracking (opcional, se completa al cerrar la generación). */
  provider?: string;
  model?: string;
}

export interface ConsumeResult {
  ok: boolean;
  generationId?: string;
  remaining: { monthly: number; addon: number; total: number };
  fromBucket?: "monthly" | "addon" | "split";
  error?: string;
  errorCode?: "NO_CREDITS" | "PLAN_EXPIRED" | "USER_NOT_FOUND";
  /** Cuando NO_CREDITS, devolvemos los packs disponibles para que el front muestre la modal. */
  availablePacks?: typeof ADDON_PACKS;
}

/**
 * Descuenta créditos del balance del AdminUser y registra la generación.
 * Llamar ANTES de invocar la API de IA real.
 *
 * Si la API falla después → refundCredit(generationId).
 */
export async function consumeCredit(input: ConsumeInput): Promise<ConsumeResult> {
  const cost = input.costOverride ?? CREDIT_COST[input.action];
  if (cost == null || cost < 0) {
    return {
      ok: false,
      remaining: { monthly: 0, addon: 0, total: 0 },
      error: `Acción desconocida: ${input.action}`,
    };
  }

  // Acciones gratis (extract_palette, analyze_reference, etc.) — registramos
  // pero no descontamos.
  if (cost === 0) {
    const gen = await db.aiGeneration.create({
      data: {
        adminUserId: input.adminUserId,
        businessId: input.businessId ?? null,
        type: input.action,
        creditsCost: 0,
        source: "monthly",
        provider: input.provider ?? null,
        model: input.model ?? null,
        costUsd: REAL_COST_USD[input.action] ?? 0,
      },
    });
    const balance = await getBalance(input.adminUserId);
    return {
      ok: true,
      generationId: gen.id,
      remaining: balance,
      fromBucket: "monthly",
    };
  }

  // Transacción atómica: lock + check + descuento + log.
  return db.$transaction(async (tx) => {
    const user = await tx.adminUser.findUnique({
      where: { id: input.adminUserId },
      select: {
        id: true,
        plan: true,
        planExpiresAt: true,
        aiCreditsMonthly: true,
        aiCreditsAddon: true,
        aiCreditsResetAt: true,
      },
    });
    if (!user) {
      return {
        ok: false,
        remaining: { monthly: 0, addon: 0, total: 0 },
        error: "Usuario no encontrado",
        errorCode: "USER_NOT_FOUND" as const,
      };
    }

    // Plan vencido (subscription cancelada/expirada)
    if (user.planExpiresAt && user.planExpiresAt < new Date()) {
      return {
        ok: false,
        remaining: { monthly: 0, addon: user.aiCreditsAddon, total: user.aiCreditsAddon },
        error: "Tu plan ha expirado. Renueva o usa créditos add-on.",
        errorCode: "PLAN_EXPIRED" as const,
      };
    }

    // Reset mensual si toca
    let monthly = user.aiCreditsMonthly;
    let resetAt = user.aiCreditsResetAt;
    const now = new Date();
    if (!resetAt || resetAt < now) {
      const planConfig = PLAN_CONFIGS[user.plan];
      monthly = planConfig.monthlyCredits;
      resetAt = nextMonthStart(now);
      await tx.adminUser.update({
        where: { id: user.id },
        data: {
          aiCreditsMonthly: monthly,
          aiCreditsResetAt: resetAt,
        },
      });
    }

    const total = monthly + user.aiCreditsAddon;
    if (total < cost) {
      return {
        ok: false,
        remaining: { monthly, addon: user.aiCreditsAddon, total },
        error: `Te faltan ${cost - total} créditos. Compra un pack add-on.`,
        errorCode: "NO_CREDITS" as const,
        availablePacks: ADDON_PACKS,
      };
    }

    // Restar primero del mensual; si no alcanza, completar con addon.
    let fromMonthly = Math.min(monthly, cost);
    let fromAddon = cost - fromMonthly;
    let bucket: "monthly" | "addon" | "split" =
      fromAddon === 0 ? "monthly" : fromMonthly === 0 ? "addon" : "split";

    const newMonthly = monthly - fromMonthly;
    const newAddon = user.aiCreditsAddon - fromAddon;

    await tx.adminUser.update({
      where: { id: user.id },
      data: {
        aiCreditsMonthly: newMonthly,
        aiCreditsAddon: newAddon,
      },
    });

    const gen = await tx.aiGeneration.create({
      data: {
        adminUserId: user.id,
        businessId: input.businessId ?? null,
        type: input.action,
        creditsCost: cost,
        source: bucket === "addon" ? "addon" : "monthly", // para split, principal es monthly
        provider: input.provider ?? null,
        model: input.model ?? null,
        costUsd: REAL_COST_USD[input.action] ?? 0,
      },
    });

    return {
      ok: true,
      generationId: gen.id,
      remaining: {
        monthly: newMonthly,
        addon: newAddon,
        total: newMonthly + newAddon,
      },
      fromBucket: bucket,
    };
  });
}

/**
 * Devuelve créditos al usuario tras un fallo de la API IA después del consumo.
 * Marca la AiGeneration como refunded para audit.
 */
export async function refundCredit(
  generationId: string,
  reason = "API call failed",
): Promise<void> {
  await db.$transaction(async (tx) => {
    const gen = await tx.aiGeneration.findUnique({
      where: { id: generationId },
      select: {
        id: true,
        adminUserId: true,
        creditsCost: true,
        source: true,
        refunded: true,
      },
    });
    if (!gen || gen.refunded || gen.creditsCost === 0) return;

    await tx.aiGeneration.update({
      where: { id: generationId },
      data: {
        refunded: true,
        refundedAt: new Date(),
        refundReason: reason,
      },
    });

    // Devolver al bucket original (si fue split, devolver al monthly por defecto)
    const fieldToRestore =
      gen.source === "addon" ? "aiCreditsAddon" : "aiCreditsMonthly";
    await tx.adminUser.update({
      where: { id: gen.adminUserId },
      data: {
        [fieldToRestore]: { increment: gen.creditsCost },
      },
    });
  });
}

/**
 * Devuelve el balance actual del usuario (con reset mensual aplicado si toca).
 */
export async function getBalance(
  adminUserId: string,
): Promise<{ monthly: number; addon: number; total: number; resetAt: Date | null }> {
  const user = await db.adminUser.findUnique({
    where: { id: adminUserId },
    select: {
      plan: true,
      aiCreditsMonthly: true,
      aiCreditsAddon: true,
      aiCreditsResetAt: true,
    },
  });
  if (!user) return { monthly: 0, addon: 0, total: 0, resetAt: null };

  // Aplicar reset si toca (de forma idempotente)
  let monthly = user.aiCreditsMonthly;
  let resetAt = user.aiCreditsResetAt;
  const now = new Date();
  if (!resetAt || resetAt < now) {
    monthly = PLAN_CONFIGS[user.plan].monthlyCredits;
    resetAt = nextMonthStart(now);
    await db.adminUser.update({
      where: { id: adminUserId },
      data: {
        aiCreditsMonthly: monthly,
        aiCreditsResetAt: resetAt,
      },
    });
  }

  return {
    monthly,
    addon: user.aiCreditsAddon,
    total: monthly + user.aiCreditsAddon,
    resetAt,
  };
}

/**
 * Añade créditos addon tras una compra confirmada de Stripe.
 * Idempotente vía stripeSessionId único en CreditPurchase.
 */
export async function addAddonCredits(input: {
  adminUserId: string;
  packKey: string;
  credits: number;
  amountUsd: number;
  stripeSessionId: string;
}): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.creditPurchase.findUnique({
      where: { stripeSessionId: input.stripeSessionId },
    });
    if (existing && existing.status === "PAID") return; // idempotente

    if (existing) {
      await tx.creditPurchase.update({
        where: { id: existing.id },
        data: { status: "PAID", paidAt: new Date() },
      });
    } else {
      await tx.creditPurchase.create({
        data: {
          adminUserId: input.adminUserId,
          pack: input.packKey,
          credits: input.credits,
          amountUsd: input.amountUsd,
          status: "PAID",
          stripeSessionId: input.stripeSessionId,
          paidAt: new Date(),
        },
      });
    }

    await tx.adminUser.update({
      where: { id: input.adminUserId },
      data: {
        aiCreditsAddon: { increment: input.credits },
      },
    });
  });
}

/**
 * Inicio del próximo mes desde una fecha (para resetAt).
 */
function nextMonthStart(from: Date): Date {
  const next = new Date(from);
  next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCDate(1);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}
