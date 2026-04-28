import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { getHealthReport } from "@/lib/health";
import { ChannelChip, type IconName } from "@/components/editorial/atoms";

export const dynamic = "force-dynamic";

const SPANISH_DAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const SPANISH_MONTHS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

function spanishGreeting(d: Date): string {
  const h = d.getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

function spanishKicker(d: Date): string {
  const day = SPANISH_DAYS[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, "0");
  const month = SPANISH_MONTHS[d.getMonth()];
  return `HOY · ${day} · ${dayNum} ${month}`;
}

function formatCountdown(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Ya";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays} d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} sem`;
}

export default async function DashboardPage() {
  const session = await requireSession();

  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    businesses,
    health,
    upcomingPosts,
    scheduledThisWeek,
    failedPosts,
    publishedToday,
    publishedThisYear,
    nextPublication,
    queuedTotal,
  ] = await Promise.all([
    db.business.findMany({
      include: { metaConnection: true },
      orderBy: { createdAt: "desc" },
    }),
    getHealthReport().catch(() => null),
    db.postDraft.findMany({
      where: {
        publishAt: { gte: now },
        status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
      },
      include: { business: true },
      orderBy: { publishAt: "asc" },
      take: 4,
    }),
    db.postDraft.count({
      where: {
        publishAt: { gte: now, lte: weekAhead },
        status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
      },
    }),
    db.postDraft.count({ where: { status: "FAILED" } }),
    db.postDraft.count({
      where: {
        status: "PUBLISHED",
        updatedAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    db.postDraft.count({
      where: {
        status: "PUBLISHED",
        updatedAt: { gte: startOfYear },
      },
    }),
    db.postDraft.findFirst({
      where: {
        publishAt: { gte: now },
        status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
      },
      include: { business: true },
      orderBy: { publishAt: "asc" },
    }),
    db.postDraft.count({
      where: {
        publishAt: { gte: now },
        status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
      },
    }),
  ]);

  const hasBusinesses = businesses.length > 0;
  const activeBusinesses = businesses.filter(
    (b) => b.metaConnection?.status === "ACTIVE",
  );
  const hasConnected = activeBusinesses.length > 0;
  const primaryBiz = activeBusinesses[0] ?? businesses[0];
  const uploadHref = primaryBiz
    ? `/businesses/${primaryBiz.slug}/upload`
    : "/businesses/new";

  const firstName = session.email?.split("@")[0] ?? "";
  const greetingTime = spanishGreeting(now);
  const kicker = spanishKicker(now);

  const subtitle = !hasBusinesses
    ? "Conecta tu primer negocio para empezar."
    : !hasConnected
      ? "Conecta Instagram para empezar."
      : queuedTotal === 0
        ? "Todo en orden. La cola está vacía."
        : queuedTotal === 1
          ? "Un post en cola."
          : `${queuedTotal} posts en cola.`;

  const failedChecks =
    health && !health.ok
      ? Object.entries(health.checks).filter(([, c]) => !c.ok)
      : [];

  const nextLabel = nextPublication
    ? formatCountdown(nextPublication.publishAt, now)
    : null;

  return (
    <div
      className="ap-root -mx-5 md:-mx-8 -mt-16 md:-mt-8 min-h-[calc(100vh-0px)]"
      style={{ background: "var(--ap-paper)" }}
    >
      <div className="px-5 md:px-12 pt-16 md:pt-12 pb-16 max-w-5xl">
        {/* ── Banner crítico ─────────────────────────── */}
        {failedChecks.length > 0 && (
          <Link
            href="/settings"
            className="block mb-10 transition-opacity hover:opacity-90"
            style={{
              padding: "14px 18px",
              border: "1.5px solid var(--ap-stamp)",
              background: "rgba(229,75,38,0.06)",
              color: "var(--ap-ink)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span
                className="ap-mono"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--ap-stamp)",
                  fontWeight: 600,
                }}
              >
                ATENCIÓN ·
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.45 }}>
                {failedChecks.length === 1
                  ? "Falta 1 pieza de configuración para publicar"
                  : `Faltan ${failedChecks.length} piezas de configuración para publicar`}{" "}
                <span style={{ color: "var(--ap-ink-3)" }}>
                  ({failedChecks.map(([k]) => k.replace(/_/g, " ")).join(" · ")})
                </span>
                <span
                  className="ap-mono"
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    color: "var(--ap-stamp)",
                    letterSpacing: "0.1em",
                  }}
                >
                  → AJUSTES
                </span>
              </span>
            </div>
          </Link>
        )}

        {/* ── Encabezado editorial ─────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              marginBottom: 14,
            }}
          >
            {kicker}
          </div>
          <h1
            className="ap-display"
            style={{
              fontSize: "clamp(40px, 6vw, 64px)",
              margin: "0 0 10px",
              letterSpacing: "-0.02em",
              color: "var(--ap-ink)",
              lineHeight: 0.95,
            }}
          >
            {greetingTime},{" "}
            <span style={{ fontStyle: "italic" }}>
              {firstName || "amigo"}.
            </span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--ap-ink-3)",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* ── KPIs ─────────────────────────────────── */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10"
          style={{
            marginBottom: 56,
            paddingBottom: 32,
            borderBottom: "1px solid var(--ap-line)",
          }}
        >
          <KPI
            n={String(publishedThisYear)}
            label="Posts este año"
            delta={null}
          />
          <KPI
            n={String(scheduledThisWeek)}
            label="Programados · 7d"
            delta={scheduledThisWeek > 0 ? "+activos" : null}
          />
          <KPI
            n={String(publishedToday)}
            label="Publicados hoy"
            delta={publishedToday > 0 ? "✓ live" : null}
          />
          <KPI
            n={String(activeBusinesses.length)}
            label="Conexiones activas"
            delta={
              failedPosts > 0 ? `${failedPosts} con error` : null
            }
            deltaColor={failedPosts > 0 ? "var(--ap-stamp)" : "var(--ap-olive)"}
          />
        </div>

        {/* ── Today + Suggestion + Channels ────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-10 md:gap-14">
          {/* Today list */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <h2
                className="ap-display"
                style={{
                  fontSize: 26,
                  margin: 0,
                  fontStyle: "italic",
                  color: "var(--ap-ink)",
                }}
              >
                Próximos
              </h2>
              <span
                className="ap-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.1em",
                }}
              >
                {upcomingPosts.length === 0
                  ? "0 PROGRAMADOS"
                  : `${queuedTotal} EN COLA`}
              </span>
            </div>

            {upcomingPosts.length === 0 ? (
              <Link
                href={uploadHref}
                className="block"
                style={{
                  padding: "26px 22px",
                  border: "1px dashed var(--ap-line-2)",
                  background: "transparent",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--ap-ink-3)",
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  Suelta una carpeta y la semana se programa sola.
                </p>
                <p
                  className="ap-mono"
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: "var(--ap-stamp)",
                    letterSpacing: "0.12em",
                  }}
                >
                  SUBIR CARPETA →
                </p>
              </Link>
            ) : (
              upcomingPosts.map((post, i, arr) => {
                const tz = post.business.timezone ?? "UTC";
                const time = formatDateInTz(post.publishAt, tz);
                const ch: IconName = "instagram"; // canal único soportado
                const stateColor =
                  post.status === "SCHEDULED"
                    ? "var(--ap-stamp)"
                    : post.status === "VALIDATED"
                      ? "var(--ap-olive)"
                      : "var(--ap-ink-4)";
                const stateLabel =
                  post.status === "SCHEDULED"
                    ? "programado"
                    : post.status === "VALIDATED"
                      ? "validado"
                      : "listo";
                return (
                  <Link
                    key={post.id}
                    href={`/businesses/${post.business.slug}/posts/${post.id}`}
                    className="grid items-center gap-4 transition-opacity hover:opacity-80"
                    style={{
                      gridTemplateColumns: "auto 22px 1fr auto",
                      padding: "18px 0",
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid var(--ap-line)"
                          : "none",
                      color: "var(--ap-ink)",
                    }}
                  >
                    <div
                      className="ap-mono"
                      style={{
                        fontSize: 12,
                        color: "var(--ap-ink-3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {time}
                    </div>
                    <ChannelChip channel={ch} size={18} />
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--ap-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.caption?.slice(0, 80) || "Sin texto"}
                      <span
                        style={{
                          color: "var(--ap-ink-4)",
                          marginLeft: 8,
                          fontSize: 12,
                        }}
                      >
                        · {post.business.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: stateColor,
                        fontStyle: "italic",
                      }}
                    >
                      {stateLabel}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {/* Suggestion card */}
            <div>
              <div
                className="ap-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ap-stamp)",
                  letterSpacing: "0.14em",
                  marginBottom: 10,
                }}
              >
                {failedPosts > 0
                  ? "AVISO"
                  : !hasBusinesses
                    ? "PRIMERA TAREA"
                    : !hasConnected
                      ? "CONFIGURACIÓN"
                      : nextPublication
                        ? "PRÓXIMA PUBLICACIÓN"
                        : "SUGERENCIA"}
              </div>
              <div
                className="ap-display"
                style={{
                  fontSize: 22,
                  fontStyle: "italic",
                  lineHeight: 1.25,
                  color: "var(--ap-ink)",
                  marginBottom: 14,
                }}
              >
                {failedPosts > 0
                  ? `${failedPosts} ${failedPosts === 1 ? "post falló" : "posts fallaron"} — revisar y reintentar.`
                  : !hasBusinesses
                    ? "Crea tu primer negocio para empezar."
                    : !hasConnected
                      ? "Conecta Instagram en menos de 30 segundos."
                      : nextPublication
                        ? `${nextPublication.business.name} — sale en ${nextLabel}.`
                        : "Sube una carpeta y programamos 30 días."}
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Link
                  href={
                    failedPosts > 0 && primaryBiz
                      ? `/businesses/${primaryBiz.slug}/posts?status=FAILED`
                      : !hasBusinesses
                        ? "/businesses/new"
                        : !hasConnected && primaryBiz
                          ? `/businesses/${primaryBiz.slug}/connect`
                          : nextPublication
                            ? `/businesses/${nextPublication.business.slug}/posts/${nextPublication.id}`
                            : uploadHref
                  }
                  style={{
                    fontSize: 12,
                    color: "var(--ap-stamp)",
                    borderBottom: "1px solid var(--ap-stamp)",
                    paddingBottom: 1,
                  }}
                >
                  {failedPosts > 0
                    ? "Revisar fallos"
                    : !hasBusinesses
                      ? "Crear negocio"
                      : !hasConnected
                        ? "Conectar"
                        : nextPublication
                          ? "Ver post"
                          : "Subir carpeta"}
                </Link>
                {hasConnected && primaryBiz && (
                  <Link
                    href={`/businesses/${primaryBiz.slug}/posts`}
                    style={{ fontSize: 12, color: "var(--ap-ink-4)" }}
                  >
                    Ver todos
                  </Link>
                )}
              </div>
            </div>

            {/* Channels */}
            <div>
              <div
                className="ap-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.14em",
                  marginBottom: 14,
                }}
              >
                CANALES
              </div>
              {!hasBusinesses ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ap-ink-4)",
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  Aún sin canales conectados.
                </p>
              ) : (
                businesses.slice(0, 6).map((b) => {
                  const isActive = b.metaConnection?.status === "ACTIVE";
                  const handle = b.metaConnection?.igUsername
                    ? `@${b.metaConnection.igUsername}`
                    : b.name;
                  return (
                    <Link
                      key={b.id}
                      href={`/businesses/${b.slug}/posts`}
                      className="transition-opacity hover:opacity-70"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "9px 0",
                        color: "var(--ap-ink)",
                      }}
                    >
                      <ChannelChip channel="instagram" size={16} />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: isActive
                            ? "var(--ap-ink)"
                            : "var(--ap-ink-4)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {handle}
                      </span>
                      <span
                        className="ap-mono"
                        style={{
                          fontSize: 10,
                          color: isActive
                            ? "var(--ap-olive)"
                            : "var(--ap-ink-4)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {isActive ? "ACTIVO" : "—"}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Primary CTA — print magazine button */}
            <Link
              href={uploadHref}
              className="ap-btn ap-btn--stamp"
              style={{
                padding: "14px 18px",
                fontSize: 13,
                width: "fit-content",
              }}
            >
              {hasBusinesses && hasConnected
                ? "Subir carpeta →"
                : !hasBusinesses
                  ? "Crear negocio →"
                  : "Conectar Instagram →"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({
  n,
  label,
  delta,
  deltaColor = "var(--ap-olive)",
}: {
  n: string;
  label: string;
  delta: string | null;
  deltaColor?: string;
}) {
  return (
    <div>
      <div
        className="ap-display"
        style={{
          fontSize: "clamp(34px, 4vw, 46px)",
          fontStyle: "italic",
          lineHeight: 1,
          color: "var(--ap-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {n}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>{label}</span>
        {delta && (
          <span
            className="ap-mono"
            style={{
              fontSize: 10,
              color: deltaColor,
              letterSpacing: "0.06em",
            }}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
