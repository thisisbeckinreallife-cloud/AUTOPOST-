/**
 * Layout compartido para /businesses/[slug]/* — header del negocio + tabs.
 *
 * Tabs:
 *   - Resumen        (/businesses/[slug])
 *   - Chat IA        (/businesses/[slug]/chat)
 *   - Calendario     (/businesses/[slug]/posts)
 *   - Estudio IA     (/businesses/[slug]/studio)
 *   - Subir          (/businesses/[slug]/upload)
 *   - Configuración  (/businesses/[slug]/settings)
 */
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { BusinessTabs } from "@/components/admin/BusinessTabs";
import { BusinessSwitcher } from "@/components/admin/BusinessSwitcher";

export const dynamic = "force-dynamic";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  await requireAuth();

  const [business, allBusinesses] = await Promise.all([
    db.business.findUnique({
      where: { slug: params.slug },
      include: {
        metaConnection: {
          select: { igUsername: true, status: true },
        },
      },
    }),
    db.business.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        metaConnection: {
          select: { igUsername: true, status: true },
        },
      },
    }),
  ]);
  if (!business) notFound();

  const igConnected = business.metaConnection?.status === "ACTIVE";
  const switcherOptions = allBusinesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    igUsername: b.metaConnection?.igUsername ?? null,
    igConnected: b.metaConnection?.status === "ACTIVE",
  }));

  return (
    <div className="ap-root" style={{ background: "var(--ap-paper)", minHeight: "100vh" }}>
      {/* Header del negocio */}
      <div
        style={{
          padding: "clamp(20px, 4vw, 36px) clamp(20px, 4vw, 40px) 0",
          borderBottom: "1px solid var(--ap-line)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <BusinessSwitcher currentSlug={params.slug} businesses={switcherOptions} />

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 20,
              margin: "10px 0 24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                className="ap-display"
                style={{
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontStyle: "italic",
                  lineHeight: 1,
                  margin: 0,
                  letterSpacing: "-0.02em",
                  color: "var(--ap-ink)",
                }}
              >
                {business.name}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ap-ink-3)",
                  fontStyle: "italic",
                  margin: "8px 0 0",
                }}
              >
                {igConnected
                  ? `@${business.metaConnection?.igUsername} · Instagram conectado`
                  : "Instagram no conectado"}
              </p>
            </div>

            {igConnected && (
              <span
                className="ap-mono"
                style={{
                  fontSize: 10,
                  color: "#6B7A2E",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  border: "1px solid #6B7A2E",
                  padding: "5px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ Activo
              </span>
            )}
          </div>

          <BusinessTabs slug={params.slug} />
        </div>
      </div>

      {/* Contenido del tab activo */}
      <div
        style={{
          padding: "clamp(20px, 4vw, 36px) clamp(20px, 4vw, 40px)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
      </div>
    </div>
  );
}
