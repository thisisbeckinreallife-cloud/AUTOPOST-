import { Sidebar } from "@/components/admin/sidebar";
import { OnboardingTour } from "@/components/admin/onboarding-tour";
import { db } from "@/lib/db";

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = await getSidebarStatus();

  return (
    <div
      className="ap-root min-h-screen relative"
      style={{ background: "var(--ap-paper)" }}
    >
      {/* Skip link for keyboard users (WCAG AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:font-semibold focus:text-sm focus:shadow-xl focus:outline-none"
        style={{
          background: "var(--ap-ink)",
          color: "var(--ap-paper)",
        }}
      >
        Saltar al contenido principal
      </a>

      <Sidebar status={status} />
      <main
        id="main-content"
        tabIndex={-1}
        className="md:ml-64 p-5 md:p-8 pt-16 md:pt-8 min-h-screen relative focus:outline-none"
      >
        <div className="max-w-4xl mx-auto animate-fade-in">{children}</div>
      </main>
      <OnboardingTour />
    </div>
  );
}
