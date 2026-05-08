/**
 * /api/account
 *
 * GET   → datos del perfil + plan + subscription para el panel /account.
 * PATCH → actualizar nombre, idioma, hideWatermark, emailNotifications.
 *         (server-side enforce: hideWatermark ignorado si plan < PRO)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession, getSession } from "@/lib/auth";
import { getEffectiveTier, FEATURES, tierLabel, tierPriceWeekly } from "@/lib/billing/plan";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireSession();
    const user = await db.adminUser.findUnique({
      where: { id: session.adminUserId },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tier = getEffectiveTier(user, user.subscription);

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      preferences: {
        language: user.language,
        hideWatermark: user.hideWatermark,
        emailNotifications: user.emailNotifications,
      },
      plan: {
        tier,
        label: tierLabel(tier, user.language as "es" | "en"),
        priceWeekly: tierPriceWeekly(tier),
        features: {
          hasWatermark: FEATURES.hasWatermark(tier),
          maxAccounts: FEATURES.maxAccounts(tier),
          postsPerMonth: FEATURES.postsPerMonth(tier),
          teamSize: FEATURES.teamSize(tier),
          prioritySupport: FEATURES.prioritySupport(tier),
        },
        subscription: user.subscription
          ? {
              status: user.subscription.status,
              tier: user.subscription.tier,
              period: user.subscription.period,
              currentPeriodEnd: user.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
              trialEnd: user.subscription.trialEnd,
            }
          : null,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[/api/account GET]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

const PatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  language: z.enum(["es", "en"]).optional(),
  hideWatermark: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    // hideWatermark ya no es relevante: la lógica del watermark se decide
    // automáticamente por tier (FREE → watermark · paid → sin). El toggle
    // se ignora de la entrada para evitar confusión con clientes legacy.
    if ("hideWatermark" in data) {
      delete data.hideWatermark;
    }

    const updated = await db.adminUser.update({
      where: { id: session.adminUserId },
      data,
      select: {
        name: true,
        language: true,
        hideWatermark: true,
        emailNotifications: true,
      },
    });

    return NextResponse.json({ ok: true, preferences: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[/api/account PATCH]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * DELETE → elimina la cuenta del usuario logueado:
 *  1. Cancela suscripción Stripe activa (si existe).
 *  2. Borra AdminUser → cascade en Subscription, AuditLogs, AiChats.
 *  3. Destruye la sesión iron-session.
 *
 * Businesses, MetaConnections, PostDrafts y demás datos del workspace
 * NO se borran automáticamente — son del workspace, no del user.
 * Si el user es el último admin, considerar borrado en cascade futura.
 */
export async function DELETE() {
  try {
    const session = await requireSession();

    const user = await db.adminUser.findUnique({
      where: { id: session.adminUserId },
      include: { subscription: true },
    });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // 1. Cancelar suscripción Stripe activa (best-effort, no bloquea borrado).
    if (user.subscription?.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId, {
          invoice_now: false,
          prorate: false,
        });
      } catch (err) {
        console.warn("[/api/account DELETE] No se pudo cancelar Stripe sub:", err);
      }
    }

    // 2. Borrar AdminUser (cascade en Subscription/AuditLogs/AiChats por schema).
    await db.adminUser.delete({ where: { id: user.id } });

    // 3. Destruir sesión.
    const sess = await getSession();
    sess.destroy();

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("[/api/account DELETE]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
