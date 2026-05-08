import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEffectiveTier, FEATURES, tierLabel, tierPriceWeekly } from "@/lib/billing/plan";
import { ProfileSection } from "./ProfileSection";
import { PlanSection } from "./PlanSection";
import { PreferencesSection } from "./PreferencesSection";
import { SecuritySection } from "./SecuritySection";
import { DangerZoneSection } from "./DangerZoneSection";

export const metadata: Metadata = {
  title: "Mi cuenta · Autopost",
  description: "Gestiona tu perfil, plan y preferencias.",
  robots: { index: false, follow: false },
};

/**
 * /account — Settings de cuenta del usuario logueado.
 * Server Component que carga datos del AdminUser + subscription, y
 * delega la edición a 5 secciones Client (cada una con su propio form).
 */
export default async function AccountPage() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.adminUserId) {
    redirect("/login?next=/account");
  }

  const user = await db.adminUser.findUnique({
    where: { id: session.adminUserId },
    include: { subscription: true },
  });
  if (!user) redirect("/login");

  const tier = getEffectiveTier(user, user.subscription);

  const profile = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };

  const plan = {
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
          currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          trialEnd: user.subscription.trialEnd?.toISOString() ?? null,
        }
      : null,
  };

  const preferences = {
    language: user.language,
    hideWatermark: user.hideWatermark,
    emailNotifications: user.emailNotifications,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-12">
        <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">
          Mi cuenta
        </p>
        <h1 className="text-3xl font-semibold text-ink-9 tracking-tight mb-2">
          Hola{user.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="text-base text-ink-7">
          Gestiona tu perfil, plan y preferencias desde aquí.
        </p>
      </header>

      <div className="flex flex-col gap-12">
        <PlanSection plan={plan} />
        <ProfileSection profile={profile} />
        <PreferencesSection
          preferences={preferences}
          hasWatermark={plan.features.hasWatermark}
        />
        <SecuritySection profile={profile} />
        <DangerZoneSection email={profile.email} />
      </div>
    </div>
  );
}
