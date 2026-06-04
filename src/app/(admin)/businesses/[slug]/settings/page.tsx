/**
 * Tab "Configuración" — datos del business + 6 cards de plataformas con
 * conexión 2-clicks vía OAuth.
 *
 * Plataformas:
 *   - Instagram + Facebook → MetaConnection legacy (ya funciona)
 *   - TikTok / LinkedIn / YouTube / Pinterest → SocialConnection nueva
 *
 * Cada card muestra estado real (conectado/disponible/configurar/coming soon)
 * y CTA correcta según el caso. Los OAuth flows abren en mismo tab vía Link.
 */
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Instagram, Facebook, AlertCircle, Shield } from "lucide-react";
import { DeleteBusinessButton } from "@/components/delete-business-button";
import { SocialPlatformCard } from "@/components/admin/SocialPlatformCard";
import { getPlatformConfigs } from "@/lib/social/platforms";
import type { SocialPlatform } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { connected?: string; error?: string };
}) {
  await requireAuth();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      timezone: true,
      description: true,
      metaConnection: {
        select: {
          igUsername: true,
          fbPageName: true,
          status: true,
          tokenExpiresAt: true,
          lastError: true,
        },
      },
      socialConnections: {
        select: {
          id: true,
          platform: true,
          externalUsername: true,
          externalDisplayName: true,
          status: true,
          expiresAt: true,
          lastError: true,
        },
      },
    },
  });
  if (!business) notFound();

  const meta = business.metaConnection;
  const igConnected = meta?.status === "ACTIVE";
  const tokenExpiringSoon =
    meta?.tokenExpiresAt &&
    new Date(meta.tokenExpiresAt).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000;

  // Map de SocialConnection por plataforma
  const socialByPlatform = new Map<SocialPlatform, (typeof business.socialConnections)[number]>();
  for (const c of business.socialConnections) {
    socialByPlatform.set(c.platform, c);
  }

  const platformConfigs = getPlatformConfigs();

  return (
    <div style={{ display: "grid", gap: 32, maxWidth: 900 }}>
      <div>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ⚙ Configuración
        </p>
        <h2
          className="ap-display"
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontStyle: "normal",
            lineHeight: 1,
            margin: "10px 0 8px",
            color: "var(--ap-ink)",
          }}
        >
          Conexiones y datos
        </h2>
      </div>

      {/* Alerts */}
      {searchParams.connected === "1" && (
        <div
          style={{
            background: "var(--ap-paper-2)",
            borderLeft: "3px solid var(--ap-olive)",
            padding: "12px 16px",
            fontSize: 14,
            color: "var(--ap-olive)",
          }}
        >
          ✓ Plataforma conectada correctamente
        </div>
      )}
      {searchParams.error && (
        <div
          style={{
            background: "var(--ap-paper-2)",
            borderLeft: "3px solid var(--ap-stamp)",
            padding: "12px 16px",
            fontSize: 14,
            color: "var(--ap-stamp)",
          }}
        >
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      {/* Brand info */}
      <section>
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Datos de la cuenta
        </p>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            gap: "10px 16px",
            fontSize: 14,
            margin: 0,
            background: "var(--ap-paper-2)",
            border: "1px solid var(--ap-line-2)",
            padding: 18,
          }}
        >
          <dt style={{ color: "var(--ap-ink-4)" }}>Nombre</dt>
          <dd style={{ margin: 0, color: "var(--ap-ink)" }}>{business.name}</dd>
          <dt style={{ color: "var(--ap-ink-4)" }}>Slug</dt>
          <dd style={{ margin: 0, fontFamily: "var(--ap-font-mono)", fontSize: 12 }}>
            {business.slug}
          </dd>
          <dt style={{ color: "var(--ap-ink-4)" }}>Zona horaria</dt>
          <dd style={{ margin: 0 }}>{business.timezone}</dd>
          {business.description && (
            <>
              <dt style={{ color: "var(--ap-ink-4)" }}>Descripción</dt>
              <dd style={{ margin: 0, color: "var(--ap-ink-2)", fontStyle: "normal" }}>
                {business.description}
              </dd>
            </>
          )}
        </dl>
      </section>

      {/* RRSS conexiones */}
      <section>
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Redes sociales · 2 clicks para conectar
        </p>
        {meta?.lastError && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--ap-paper-2)",
              borderLeft: "2px solid var(--ap-stamp)",
              fontSize: 12,
              color: "var(--ap-stamp)",
              marginBottom: 12,
              fontFamily: "var(--ap-font-mono)",
            }}
          >
            <AlertCircle className="h-3.5 w-3.5 inline mr-2" />
            Último error Meta: {meta.lastError.slice(0, 200)}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {/* Instagram (legacy MetaConnection) */}
          <LegacyChannelCard
            label="Instagram"
            icon={<Instagram className="h-5 w-5" />}
            connected={igConnected}
            expiringSoon={!!tokenExpiringSoon}
            detail={
              igConnected
                ? `@${meta?.igUsername}${tokenExpiringSoon ? " · token expira pronto" : ""}`
                : "Conecta vía Meta API oficial"
            }
            connectHref={`/businesses/${params.slug}/connect`}
          />
          <LegacyChannelCard
            label="Facebook"
            icon={<Facebook className="h-5 w-5" />}
            connected={!!meta?.fbPageName}
            expiringSoon={!!tokenExpiringSoon}
            detail={meta?.fbPageName ?? "Se conecta junto con Instagram"}
            connectHref={`/businesses/${params.slug}/connect`}
          />

          {/* Plataformas nuevas via SocialConnection */}
          {platformConfigs.map((cfg) => {
            const conn = socialByPlatform.get(cfg.platform);
            return (
              <SocialPlatformCard
                key={cfg.platform}
                businessId={business.id}
                config={cfg}
                connection={
                  conn
                    ? {
                        username: conn.externalUsername,
                        displayName: conn.externalDisplayName,
                        status: conn.status,
                        expiresAt: conn.expiresAt?.toISOString() ?? null,
                        lastError: conn.lastError,
                      }
                    : null
                }
              />
            );
          })}
        </div>
      </section>

      {/* Zona peligrosa */}
      <section
        style={{
          padding: 20,
          background: "var(--ap-paper-2)",
          borderLeft: "2px solid var(--ap-stamp)",
        }}
      >
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-stamp)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 8px",
            fontWeight: 600,
          }}
        >
          ⚠ Zona peligrosa
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink)" }}>
              Eliminar esta cuenta
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 11,
                color: "var(--ap-ink-3)",
                fontStyle: "normal",
              }}
            >
              Borra todos los posts, batches, conexiones sociales. Irreversible.
            </p>
          </div>
          <DeleteBusinessButton slug={params.slug} name={business.name} />
        </div>
      </section>
    </div>
  );
}

function LegacyChannelCard({
  label,
  icon,
  connected,
  expiringSoon = false,
  detail,
  connectHref,
}: {
  label: string;
  icon: React.ReactNode;
  connected: boolean;
  expiringSoon?: boolean;
  detail: string;
  connectHref: string;
}) {
  const needsAttention = connected && expiringSoon;
  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: needsAttention
          ? "1px solid var(--ap-stamp)"
          : connected
            ? "1px solid var(--ap-olive)"
            : "1px solid var(--ap-line-2)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: "var(--ap-paper)",
          border: "1px solid var(--ap-line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--ap-ink)",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink)", fontWeight: 600 }}>
          {label}
        </p>
        <p
          className="ap-mono"
          style={{
            margin: "2px 0 0",
            fontSize: 10,
            color: needsAttention
              ? "var(--ap-stamp)"
              : connected
                ? "var(--ap-olive)"
                : "var(--ap-ink-3)",
            letterSpacing: "0.1em",
          }}
        >
          {detail}
        </p>
      </div>
      {needsAttention ? (
        <a
          href={connectHref}
          className="ap-btn ap-btn--stamp"
          style={{
            padding: "8px 12px",
            fontSize: 10,
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Reconectar
        </a>
      ) : connected ? (
        <span
          className="ap-mono"
          style={{
            fontSize: 9,
            color: "var(--ap-olive)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            border: "1px solid var(--ap-olive)",
            padding: "3px 8px",
          }}
        >
          <Shield className="h-3 w-3 inline mr-1" />
          OK
        </span>
      ) : (
        <a
          href={connectHref}
          className="ap-btn ap-btn--stamp"
          style={{
            padding: "8px 12px",
            fontSize: 10,
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Conectar
        </a>
      )}
    </div>
  );
}
