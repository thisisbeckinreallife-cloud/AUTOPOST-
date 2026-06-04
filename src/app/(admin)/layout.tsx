import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { OnboardingTour } from "@/components/admin/onboarding-tour";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getSidebarStatus() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const [failed24h, expiring] = await Promise.all([
      db.postDraft.count({
        where: { status: "FAILED", failedAt: { gte: yesterday } },
      }),
      db.metaConnection.count({
        where: {
          status: "ACTIVE",
          tokenExpiresAt: { lte: sevenDays, gte: new Date() },
        },
      }),
    ]);
    return { failed24h, expiring };
  } catch {
    return { failed24h: 0, expiring: 0 };
  }
}

/**
 * Onboarding gate: si el usuario aún no ha completado el wizard, lo
 * redirigimos al paso donde lo dejó. Esto se ejecuta en TODAS las rutas
 * dentro de (admin), así que cubre /dashboard, /businesses/*, /settings,
 * /metrics, /logs, etc.
 *
 * Si la columna no existe (DB sin migrar) tratamos al usuario como ya
 * completado para no romper sesiones existentes.
 */
async function checkOnboarding(adminUserId: string) {
  try {
    const user = await db.adminUser.findUnique({
      where: { id: adminUserId },
      select: { onboardingCompleted: true, onboardingStep: true },
    });
    if (!user) return;
    if (user.onboardingCompleted) return; // ya completado, seguir

    // Defensa contra cuentas legacy / wizard que nunca llamó a
    // /api/onboarding/complete: si la instancia YA tiene negocios, el
    // onboarding evidentemente se hizo (single-tenant — los negocios son
    // compartidos). Forzarlo de nuevo al entrar desde otro dispositivo es
    // un bug. Auto-completamos para que no vuelva a ocurrir y dejamos pasar.
    const businessCount = await db.business.count();
    if (businessCount > 0) {
      await db.adminUser
        .update({
          where: { id: adminUserId },
          data: { onboardingCompleted: true },
        })
        .catch(() => {
          /* si falla el update no bloqueamos: el usuario igual pasa */
        });
      return;
    }

    // Cuenta nueva sin negocios → sí tiene sentido el wizard.
    const step = Math.max(1, Math.min(5, user.onboardingStep || 1));
    redirect(`/onboarding/${step}`);
  } catch (err) {
    // Re-lanzar redirect (Next.js usa una excepción especial)
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    // Cualquier otro error de DB lo silenciamos: no bloqueamos al usuario.
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Sesión obligatoria
  const session = await requireAuth("/login");
  // 2. Onboarding obligatorio antes de entrar al admin
  await checkOnboarding(session.adminUserId);

  const status = await getSidebarStatus();

  return (
    <div className="ap-root min-h-screen bg-ink-1 relative">
      {/* Skip link for keyboard users (WCAG AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-accent focus:text-ink-0 focus:font-semibold focus:text-sm focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-accent-ring"
      >
        Saltar al contenido principal
      </a>

      <Sidebar status={status} />
      <main
        id="main-content"
        tabIndex={-1}
        className="md:ml-64 p-5 md:p-8 pt-16 md:pt-8 min-h-screen relative focus:outline-none"
      >
        <div className="max-w-6xl mx-auto animate-fade-in">{children}</div>
      </main>
      <OnboardingTour />
    </div>
  );
}
