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
          select: { igUsername: true, status: true, tokenExpiresAt: true },
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
  let tokenExpiringSoon =
    igConnected &&
    business.metaConnection?.tokenExpiresAt != null &&
    new Date(business.metaConnection.tokenExpiresAt).getTime() <
      Date.now() + 7 * 24 * 60 * 60 * 1000;

  // Auto-refresh oportunista: si el usuario abre el panel y el token está
  // cerca de expirar (<30d), intentamos renovarlo silenciosamente antes
  // de renderizar. Bloquea ~500ms-1s en el peor caso. Si funciona, el
  // usuario nunca ve el aviso "Renovar token". Si Meta rechaza el refresh
  // (token totalmente caducado, app revoked), la connection se marca
  // TOKEN_EXPIRED y el botón "Renovar" sigue ahí para reconexión manual.
  if (igConnected && business.metaConnection) {
    const { refreshMetaToken, shouldRefresh } = await import("@/lib/social/meta/refresh");
    const fullConn = await db.metaConnection.findUnique({
      where: { businessId: business.id },
    });
    if (fullConn && shouldRefresh(fullConn)) {
      const result = await refreshMetaToken(fullConn);
      if (result.refreshed && result.expiresAt) {
        // El usuario verá la página con el token renovado.
        business.metaConnection.tokenExpiresAt = result.expiresAt;
        tokenExpiringSoon =
          new Date(result.expiresAt).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000;
      }
    }
  }
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
                  color: tokenExpiringSoon ? "var(--ap-stamp)" : "var(--ap-ink-3)",
                  fontStyle: "italic",
                  margin: "8px 0 0",
                }}
              >
                {!igConnected
                  ? "Instagram no conectado"
                  : tokenExpiringSoon
                    ? `@${business.metaConnection?.igUsername} · token expira pronto, reconecta para seguir publicando`
                    : `@${business.metaConnection?.igUsername} · Instagram conectado`}
              </p>
            </div>

            {igConnected && (
              tokenExpiringSoon ? (
                <a
                  href={`/businesses/${params.slug}/connect`}
                  className="ap-btn ap-btn--stamp"
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--ap-font-mono)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "5px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⚠ Renovar token</a>
              ) : (
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
              )
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
