/**
 * /informe/[token]
 *
 * Página pública editorial — informe del periodo. Server component, sin
 * auth. CSS @media print preparado para Cmd+P → Save as PDF.
 *
 * El cliente no tiene login: comparte URL, abre, imprime. Eso es todo.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Logo, Icon } from "@/components/editorial/atoms";
import type {
  DailyEntry,
  ByType,
  TopPost,
} from "@/lib/reports/snapshot";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Informe editorial · AutoPost",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { token: string };
}

export default async function ReportPage({ params }: PageProps) {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(params.token)) notFound();

  const report = await db.report.findUnique({
    where: { token: params.token },
    include: {
      business: {
        select: { name: true, timezone: true, slug: true },
      },
    },
  });
  if (!report) notFound();
  if (report.expiresAt < new Date()) {
    return (
      <ExpiredScreen
        businessName={report.business.name}
        expiresAt={report.expiresAt}
      />
    );
  }

  // Side-effect: actualiza viewCount + lastViewedAt sin bloquear el render.
  await db.report
    .update({
      where: { id: report.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    })
    .catch(() => {});

  const daily = report.daily as unknown as DailyEntry[];
  const byType = report.byType as unknown as ByType;
  const topPosts = report.topPosts as unknown as TopPost[];

  const periodLabel = formatPeriod(report.periodStart, report.periodEnd);
  const generatedAt = report.createdAt.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="ap-root informe-root"
      style={{
        background: "var(--ap-paper)",
        color: "var(--ap-ink)",
        minHeight: "100vh",
      }}
    >
      <PrintStyles />

      <div
        className="informe-page"
        style={{
          maxWidth: 920,
          margin: "0 auto",
          padding: "clamp(24px, 5vw, 64px) clamp(20px, 4vw, 56px)",
        }}
      >
        {/* Header magazine */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 24,
            borderBottom: "1px solid var(--ap-line)",
            marginBottom: 32,
          }}
        >
          <Logo size={20} />
          <span
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            ✦ Informe · Edición
          </span>
        </header>

        {/* Cover */}
        <section style={{ marginBottom: 48 }}>
          <p
            className="ap-mono"
            style={{
              fontSize: 11,
              color: "var(--ap-stamp)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {report.business.name}
          </p>
          <h1
            className="ap-display"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              fontStyle: "italic",
              lineHeight: 0.95,
              letterSpacing: "-0.025em",
              margin: "12px 0 16px",
              color: "var(--ap-ink)",
            }}
          >
            La edición<br />
            <i>del periodo</i>.
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 19px)",
              color: "var(--ap-ink-3)",
              fontStyle: "italic",
              margin: 0,
              maxWidth: 620,
            }}
          >
            {periodLabel}. Resumen editorial de las publicaciones programadas y
            ejecutadas por AutoPost durante este periodo.
          </p>
        </section>

        {/* KPI grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 0,
            border: "1px solid var(--ap-line-2)",
            marginBottom: 48,
          }}
        >
          <Kpi
            kicker="Posts publicados"
            value={String(report.totalPublished)}
            sub={`${byType.IMAGE} sencillos · ${byType.CAROUSEL} carruseles · ${byType.REEL} reels`}
            stamp={true}
          />
          <Kpi
            kicker="Tasa de éxito"
            value={`${report.successRate.toFixed(1)}%`}
            sub={`${report.totalFailed} fallos · ${report.totalPublished + report.totalFailed} ejecutados`}
          />
          <Kpi
            kicker="Programados"
            value={String(report.totalScheduled)}
            sub="Pendientes de publicar"
          />
        </section>

        {/* Daily timeline */}
        <section style={{ marginBottom: 56 }}>
          <SectionHeader index="01" kicker="Calendario" />
          <DailyChart daily={daily} />
        </section>

        {/* Top posts */}
        {topPosts.length > 0 && (
          <section style={{ marginBottom: 56 }} className="break-inside-avoid">
            <SectionHeader index="02" kicker="Highlights" />
            <PostsGrid posts={topPosts} />
          </section>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--ap-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <p
              className="ap-mono"
              style={{
                fontSize: 10,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              ✦ AutoPost · Edición editorial
            </p>
            <p
              style={{
                fontSize: 11,
                color: "var(--ap-ink-4)",
                fontStyle: "italic",
                margin: "4px 0 0",
              }}
            >
              Generado el {generatedAt} · Token expira el{" "}
              {report.expiresAt.toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            type="button"
            className="ap-btn ap-btn--stamp informe-print-btn"
            style={{
              padding: "10px 18px",
              fontSize: 12,
            }}
            onClick={
              // server component: el botón usa onClick inline via attribute.
              // Mejor: usar form con attr como hint, o dejar como CSS-only.
              undefined
            }
            data-print="true"
          >
            <Icon name="arrow" size={14} c="currentColor" />
            <span style={{ marginLeft: 6 }}>Imprimir / Guardar PDF</span>
          </button>
        </footer>
      </div>

      {/* Inline script para el botón de imprimir (server component-friendly) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelectorAll('[data-print="true"]').forEach(b => {
              b.addEventListener('click', () => window.print());
            });
          `,
        }}
      />
    </div>
  );
}

function SectionHeader({ index, kicker }: { index: string; kicker: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr",
        gap: 18,
        alignItems: "baseline",
        marginBottom: 20,
      }}
    >
      <span
        className="ap-display"
        style={{
          fontSize: 36,
          fontStyle: "italic",
          color: "var(--ap-stamp)",
          lineHeight: 1,
        }}
      >
        {index}
      </span>
      <p
        className="ap-mono"
        style={{
          fontSize: 11,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {kicker}
      </p>
    </div>
  );
}

function Kpi({
  kicker,
  value,
  sub,
  stamp,
}: {
  kicker: string;
  value: string;
  sub: string;
  stamp?: boolean;
}) {
  return (
    <div
      style={{
        padding: "28px 24px",
        borderRight: "1px solid var(--ap-line-2)",
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: stamp ? "var(--ap-stamp)" : "var(--ap-ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          margin: "0 0 12px",
        }}
      >
        {kicker}
      </p>
      <p
        className="ap-display"
        style={{
          fontSize: "clamp(40px, 5vw, 56px)",
          fontStyle: "italic",
          color: "var(--ap-ink)",
          lineHeight: 1,
          margin: 0,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--ap-ink-3)",
          fontStyle: "italic",
          margin: "10px 0 0",
        }}
      >
        {sub}
      </p>
    </div>
  );
}

function DailyChart({ daily }: { daily: DailyEntry[] }) {
  const max = Math.max(
    1,
    ...daily.map((d) => d.published + d.scheduled + d.failed),
  );
  return (
    <div>
      <div
        role="figure"
        aria-label="Gráfico de barras: posts por día del periodo"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${daily.length}, 1fr)`,
          gap: 2,
          alignItems: "end",
          height: 160,
          paddingBottom: 8,
          borderBottom: "1px solid var(--ap-line)",
        }}
      >
        {daily.map((d) => {
          const total = d.published + d.scheduled + d.failed;
          const pubH = total > 0 ? (d.published / max) * 140 : 0;
          const schH = total > 0 ? (d.scheduled / max) * 140 : 0;
          const failH = total > 0 ? (d.failed / max) * 140 : 0;
          return (
            <div
              key={d.date}
              title={`${d.date} · ${d.published} pub · ${d.scheduled} prog · ${d.failed} fallos`}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: 1,
                minHeight: 4,
              }}
            >
              {failH > 0 && (
                <div
                  style={{
                    height: failH,
                    background: "var(--ap-ink-4)",
                    opacity: 0.6,
                  }}
                />
              )}
              {schH > 0 && (
                <div
                  style={{
                    height: schH,
                    background: "var(--ap-ink-3)",
                  }}
                />
              )}
              <div
                style={{
                  height: Math.max(pubH, total > 0 ? 2 : 0),
                  background: "var(--ap-stamp)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          fontSize: 11,
          color: "var(--ap-ink-4)",
          fontFamily: "var(--ap-font-mono)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <LegendDot color="var(--ap-stamp)" label="Publicados" />
        <LegendDot color="var(--ap-ink-3)" label="Programados" />
        <LegendDot color="var(--ap-ink-4)" label="Fallos" />
      </div>

      {/* Date scale */}
      {daily.length <= 31 && (
        <div
          style={{
            marginTop: 6,
            display: "grid",
            gridTemplateColumns: `repeat(${daily.length}, 1fr)`,
            gap: 2,
            fontSize: 9,
            color: "var(--ap-ink-4)",
            fontFamily: "var(--ap-font-mono)",
          }}
        >
          {daily.map((d, i) => (
            <span
              key={d.date}
              style={{
                textAlign: "center",
                visibility: i % Math.max(1, Math.floor(daily.length / 7)) === 0 ? "visible" : "hidden",
              }}
            >
              {d.date.slice(8)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

function PostsGrid({ posts }: { posts: TopPost[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {posts.map((p) => {
        const date = new Date(p.publishedAt).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
        });
        return (
          <article
            key={p.id}
            className="break-inside-avoid"
            style={{
              border: "1px solid var(--ap-line-2)",
              background: "var(--ap-paper-2)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {p.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.thumbUrl}
                alt=""
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  background: "var(--ap-paper)",
                  border: "1px solid var(--ap-line)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  background: "var(--ap-paper)",
                  border: "1px solid var(--ap-line)",
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                fontFamily: "var(--ap-font-mono)",
                color: "var(--ap-ink-4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              <span>{p.postType}</span>
              <span>{date}</span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--ap-ink-2)",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              {p.caption}
            </p>
            {p.permalink && (
              <a
                href={p.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="ap-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ap-stamp)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Ver en Instagram →
              </a>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ExpiredScreen({
  businessName,
  expiresAt,
}: {
  businessName: string;
  expiresAt: Date;
}) {
  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper)",
        minHeight: "100vh",
        padding: "clamp(40px, 8vw, 96px) clamp(20px, 5vw, 56px)",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-stamp)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ✦ {businessName}
        </p>
        <h1
          className="ap-display"
          style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontStyle: "italic",
            lineHeight: 1,
            margin: "16px 0",
            color: "var(--ap-ink)",
          }}
        >
          Este informe<br />
          <i>ha caducado</i>.
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--ap-ink-3)",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          Pídele a tu agencia un informe nuevo. Este expiró el{" "}
          {expiresAt.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      </div>
    </div>
  );
}

function formatPeriod(start: Date, end: Date): string {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    })} – ${end.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`;
  }
  return `${start.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })} – ${end.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

function PrintStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
@media print {
  @page {
    size: A4;
    margin: 18mm 14mm;
  }
  body { background: #FFFFFF !important; }
  .informe-print-btn { display: none !important; }
  .informe-page {
    padding: 0 !important;
    max-width: none !important;
  }
  .break-inside-avoid {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .informe-root {
    background: #FFFFFF !important;
    color: #14110D !important;
  }
  /* Hairlines un poco más oscuras para imprimir mejor */
  hr { border-color: #BBB !important; }
}
`,
      }}
    />
  );
}
