/**
 * Tab "Resumen" — overview de un business.
 * Header + tabs viven en layout.tsx — aquí solo el contenido del tab.
 */
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BusinessOverviewPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { connected?: string; error?: string };
}) {
  await requireAuth();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    include: {
      uploadBatches: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          originalFilename: true,
          status: true,
          validPosts: true,
          createdAt: true,
        },
      },
      _count: { select: { postDrafts: true } },
    },
  });
  if (!business) notFound();

  const upcomingCount = await db.postDraft.count({
    where: {
      businessId: business.id,
      publishAt: { gte: new Date() },
      status: { in: ["SCHEDULED", "READY"] },
    },
  });
  const publishedCount = await db.postDraft.count({
    where: { businessId: business.id, status: "PUBLISHED" },
  });
  const failedCount = await db.postDraft.count({
    where: { businessId: business.id, status: "FAILED" },
  });

  return (
    <div style={{ display: "grid", gap: 28 }}>
      {/* Alerts (post-OAuth callback) */}
      {searchParams.connected === "1" && (
        <div
          style={{
            background: "var(--ap-paper-2)",
            borderLeft: "3px solid var(--ap-olive)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 14,
            color: "var(--ap-olive)",
          }}
        >
          <CheckCircle className="h-4 w-4" />
          Instagram conectado correctamente
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

      {/* Quick actions */}
      <section>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Acciones rápidas
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          <QuickAction
            href={`/businesses/${params.slug}/chat`}
            icon={<Sparkles className="h-4 w-4" />}
            label="Subir con IA"
            sub="Chat: ZIP, imágenes o video → IA agrupa y propone"
            primary
          />
          <QuickAction
            href={`/businesses/${params.slug}/posts`}
            icon={<Calendar className="h-4 w-4" />}
            label="Ver calendario"
            sub={`${upcomingCount} programados`}
          />
        </div>
      </section>

      {/* Stats */}
      <section>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Estado
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 0,
            border: "1px solid var(--ap-line-2)",
          }}
        >
          <Kpi
            href={`/businesses/${params.slug}/posts?status=SCHEDULED`}
            kicker="Programados"
            value={upcomingCount}
            color="var(--ap-stamp)"
            stamp
          />
          <Kpi
            href={`/businesses/${params.slug}/posts?status=PUBLISHED`}
            kicker="Publicados"
            value={publishedCount}
            color="var(--ap-ink)"
          />
          <Kpi
            href={`/businesses/${params.slug}/posts?status=FAILED`}
            kicker="Con errores"
            value={failedCount}
            color={failedCount > 0 ? "var(--ap-stamp)" : "var(--ap-ink-3)"}
          />
        </div>
      </section>

      {/* Recent uploads */}
      {business.uploadBatches.length > 0 && (
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
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
              Subidas recientes
            </p>
            <Link
              href={`/businesses/${params.slug}/batches`}
              className="ap-mono"
              style={{
                fontSize: 11,
                color: "var(--ap-stamp)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Ver todo →
            </Link>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {business.uploadBatches.map((batch) => (
              <li key={batch.id}>
                <Link
                  href={`/businesses/${params.slug}/batches/${batch.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "var(--ap-paper-2)",
                    border: "1px solid var(--ap-line-2)",
                    marginBottom: 6,
                    textDecoration: "none",
                    color: "var(--ap-ink)",
                    transition: "border-color 150ms",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "var(--ap-ink-2)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {batch.originalFilename}
                    </p>
                    <p
                      className="ap-mono"
                      style={{
                        margin: "2px 0 0",
                        fontSize: 10,
                        color: "var(--ap-ink-4)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {formatDate(batch.createdAt)} · {batch.validPosts ?? 0} posts
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4" style={{ color: "var(--ap-ink-4)" }} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  sub,
  primary,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        background: primary ? "var(--ap-ink)" : "var(--ap-paper-2)",
        border: primary ? "1px solid var(--ap-ink)" : "1px solid var(--ap-line-2)",
        textDecoration: "none",
        color: primary ? "var(--ap-paper)" : "var(--ap-ink)",
        transition: "transform 150ms ease-out",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: primary ? "rgba(241,236,226,0.15)" : "var(--ap-paper)",
          border: primary ? "none" : "1px solid var(--ap-line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: primary ? "var(--ap-paper)" : "var(--ap-ink)",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          className="ap-display"
          style={{
            margin: 0,
            fontSize: 16,
            fontStyle: "normal",
            lineHeight: 1.1,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: "2px 0 0",
            fontSize: 11,
            color: primary ? "rgba(241,236,226,0.7)" : "var(--ap-ink-3)",
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          {sub}
        </p>
      </div>
    </Link>
  );
}

function Kpi({
  href,
  kicker,
  value,
  color,
  stamp,
}: {
  href: string;
  kicker: string;
  value: number;
  color: string;
  stamp?: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "20px 22px",
        borderRight: "1px solid var(--ap-line-2)",
        textDecoration: "none",
        color: "inherit",
        background: "var(--ap-paper)",
        transition: "background 150ms",
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: stamp ? "var(--ap-stamp)" : "var(--ap-ink-4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        {kicker}
      </p>
      <p
        className="ap-display"
        style={{
          fontSize: 36,
          fontStyle: "normal",
          lineHeight: 1,
          margin: 0,
          color,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
    </Link>
  );
}
