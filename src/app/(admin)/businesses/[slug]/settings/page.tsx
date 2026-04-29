/**
 * Tab "Configuración" del business — conexiones de RRSS + zona peligrosa.
 *
 * Muestra una tarjeta por cada red social:
 *   - Instagram (vivo, vía Meta API oficial)
 *   - Facebook (incluido en la conexión Meta)
 *   - TikTok (próximamente Sprint 6)
 *   - LinkedIn (próximamente Sprint 6)
 *   - X / Twitter (próximamente Sprint 6)
 *
 * Plus: zona de borrar el business.
 */
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Instagram, Facebook, AlertCircle, Shield } from "lucide-react";
import { DeleteBusinessButton } from "@/components/delete-business-button";

export const dynamic = "force-dynamic";

interface SocialChannel {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: "connected" | "available" | "coming_soon";
  detail?: string;
  connectHref?: string;
}

export default async function SettingsPage({
  params,
}: {
  params: { slug: string };
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
    },
  });
  if (!business) notFound();

  const meta = business.metaConnection;
  const igConnected = meta?.status === "ACTIVE";
  const tokenExpiringSoon =
    meta?.tokenExpiresAt &&
    new Date(meta.tokenExpiresAt).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000;

  const channels: SocialChannel[] = [
    {
      key: "instagram",
      label: "Instagram",
      icon: <Instagram className="h-5 w-5" />,
      status: igConnected ? "connected" : "available",
      detail: igConnected
        ? `@${meta?.igUsername}${tokenExpiringSoon ? " · token expira pronto" : ""}`
        : "Conecta vía Meta API oficial",
      connectHref: `/businesses/${params.slug}/connect`,
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: <Facebook className="h-5 w-5" />,
      status: meta?.fbPageName ? "connected" : "available",
      detail: meta?.fbPageName
        ? meta.fbPageName
        : "Se conecta junto con Instagram",
      connectHref: `/businesses/${params.slug}/connect`,
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: <span style={{ fontSize: 16, lineHeight: 1 }}>🎵</span>,
      status: "coming_soon",
      detail: "Roadmap Sprint 6 · Q3",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: <span style={{ fontSize: 16, lineHeight: 1 }}>in</span>,
      status: "coming_soon",
      detail: "Roadmap Sprint 6 · Q3",
    },
    {
      key: "x",
      label: "X (Twitter)",
      icon: <span style={{ fontSize: 16, lineHeight: 1 }}>𝕏</span>,
      status: "coming_soon",
      detail: "Roadmap Sprint 6 · Q3",
    },
    {
      key: "youtube",
      label: "YouTube Shorts",
      icon: <span style={{ fontSize: 16, lineHeight: 1 }}>▶</span>,
      status: "coming_soon",
      detail: "Roadmap futuro",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 32, maxWidth: 900 }}>
      <div>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.18em",
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
            fontStyle: "italic",
            lineHeight: 1,
            margin: "10px 0 8px",
            color: "var(--ap-ink)",
          }}
        >
          Conexiones y datos
        </h2>
      </div>

      {/* Brand info */}
      <section>
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.18em",
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
              <dd style={{ margin: 0, color: "var(--ap-ink-2)", fontStyle: "italic" }}>
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
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Redes sociales conectadas
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
            Último error: {meta.lastError.slice(0, 200)}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 10,
          }}
        >
          {channels.map((c) => (
            <ChannelCard key={c.key} channel={c} />
          ))}
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
            letterSpacing: "0.18em",
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
                fontStyle: "italic",
              }}
            >
              Borra todos los posts, batches, brand DNA, y desconecta Instagram. Irreversible.
            </p>
          </div>
          <DeleteBusinessButton slug={params.slug} name={business.name} />
        </div>
      </section>
    </div>
  );
}

function ChannelCard({ channel }: { channel: SocialChannel }) {
  const isConnected = channel.status === "connected";
  const isComingSoon = channel.status === "coming_soon";

  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: isConnected
          ? "1px solid #6B7A2E"
          : "1px solid var(--ap-line-2)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: isComingSoon ? 0.55 : 1,
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
          fontFamily: "var(--ap-font-mono)",
          fontWeight: 700,
        }}
      >
        {channel.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--ap-ink)",
            fontWeight: 600,
          }}
        >
          {channel.label}
        </p>
        <p
          className="ap-mono"
          style={{
            margin: "2px 0 0",
            fontSize: 10,
            color: isConnected
              ? "#6B7A2E"
              : isComingSoon
                ? "var(--ap-ink-4)"
                : "var(--ap-ink-3)",
            letterSpacing: "0.1em",
          }}
        >
          {channel.detail}
        </p>
      </div>
      {isConnected ? (
        <span
          className="ap-mono"
          title="Conectado"
          style={{
            fontSize: 9,
            color: "#6B7A2E",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            border: "1px solid #6B7A2E",
            padding: "3px 8px",
          }}
        >
          <Shield className="h-3 w-3 inline mr-1" />
          OK
        </span>
      ) : isComingSoon ? (
        <span
          className="ap-mono"
          style={{
            fontSize: 9,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          PRÓX.
        </span>
      ) : (
        <Link
          href={channel.connectHref ?? "#"}
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
        </Link>
      )}
    </div>
  );
}
