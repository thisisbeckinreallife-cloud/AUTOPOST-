import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutGrid,
  CalendarClock,
  CheckCircle2,
  Link2,
  AlertTriangle,
  ArrowRight,
  Upload,
  Calendar,
  Image as ImageIcon,
  Film,
  Layers,
} from "lucide-react";
import { getHealthReport } from "@/lib/health";

export const dynamic = "force-dynamic";

const SHORT_DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** "mié 14:30" en la timezone del negocio. */
function shortDateTime(date: Date, tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
      hour12: false,
    });
    return fmt.format(date).replace(",", "");
  } catch {
    const d = SHORT_DAYS[date.getDay()];
    return `${d} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
}

function todayLabel(d: Date): string {
  const fmt = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const s = fmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatCountdown(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "ahora";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `en ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `en ${diffHr} h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `en ${diffDays} d`;
  return `en ${Math.floor(diffDays / 7)} sem`;
}

function typeIcon(mime: string | undefined, count: number) {
  if (mime?.startsWith("video/")) return <Film className="h-4 w-4" />;
  if (count > 1) return <Layers className="h-4 w-4" />;
  return <ImageIcon className="h-4 w-4" />;
}

export default async function DashboardPage() {
  await requireAuth();

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
      include: {
        business: { include: { metaConnection: true } },
        _count: { select: { mediaAssets: true } },
        mediaAssets: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { storageUrl: true, mimeType: true },
        },
      },
      orderBy: { publishAt: "asc" },
      take: 6,
    }),
    db.postDraft.count({
      where: {
        publishAt: { gte: now, lte: weekAhead },
        status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
      },
    }),
    db.postDraft.count({ where: { status: "FAILED" } }),
    db.postDraft.count({
      where: { status: "PUBLISHED", updatedAt: { gte: startOfToday, lt: endOfToday } },
    }),
    db.postDraft.count({ where: { status: "PUBLISHED", updatedAt: { gte: startOfYear } } }),
    db.postDraft.findFirst({
      where: {
        publishAt: { gte: now },
        status: { in: ["SCHEDULED", "READY", "VALIDATED"] },
      },
      include: {
        business: { include: { metaConnection: true } },
        _count: { select: { mediaAssets: true } },
        mediaAssets: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { storageUrl: true, mimeType: true },
        },
      },
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
  const activeBusinesses = businesses.filter((b) => b.metaConnection?.status === "ACTIVE");
  const hasConnected = activeBusinesses.length > 0;
  const primaryBiz = activeBusinesses[0] ?? businesses[0];
  const uploadHref = primaryBiz ? `/businesses/${primaryBiz.slug}/chat` : "/businesses/new";
  const calendarHref = primaryBiz ? `/businesses/${primaryBiz.slug}/posts?view=calendar` : "/businesses";

  const failedChecks =
    health && !health.ok ? Object.entries(health.checks).filter(([, c]) => !c.ok) : [];

  const ctaLabel = !hasBusinesses
    ? "Crear negocio"
    : !hasConnected
      ? "Conectar Instagram"
      : "Subir carpeta";
  const ctaHref = !hasBusinesses
    ? "/businesses/new"
    : !hasConnected && primaryBiz
      ? `/businesses/${primaryBiz.slug}/connect`
      : uploadHref;

  return (
    <div className="text-ink-9">
      {/* ── Page header (compacto) ─────────────────────────────── */}
      <header className="flex items-start justify-between gap-4 flex-wrap mb-6 pb-5 border-b border-ink-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-9 tracking-tight">Inicio</h1>
          <p className="text-[13px] text-ink-7 mt-0.5">{todayLabel(now)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={calendarHref}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-ink-5 text-ink-9 font-medium text-sm hover:bg-ink-3 transition-colors"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Calendario
          </Link>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-fg font-medium text-sm shadow-md hover:bg-primary-hover transition-all"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* ── Banner alertas (solo si hay) ───────────────────────── */}
      {(failedPosts > 0 || failedChecks.length > 0) && (
        <Link
          href={
            failedPosts > 0 && primaryBiz
              ? `/businesses/${primaryBiz.slug}/posts?status=FAILED`
              : "/settings"
          }
          className="flex items-center justify-between gap-4 mb-6 px-4 py-3 rounded-lg bg-error-soft border border-error/20 hover:border-error/40 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-sm text-ink-9 min-w-0">
            <AlertTriangle className="h-4 w-4 text-error shrink-0" aria-hidden="true" />
            <span className="truncate">
              {failedPosts > 0
                ? `${failedPosts} ${failedPosts === 1 ? "post falló" : "posts fallaron"} al publicar`
                : `${failedChecks.length} ${failedChecks.length === 1 ? "pieza de configuración pendiente" : "piezas de configuración pendientes"}`}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-sm text-error-strong font-medium shrink-0">
            Revisar <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </Link>
      )}

      {/* ── KPI row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={<LayoutGrid className="h-4 w-4" />}
          value={publishedThisYear}
          label="Posts este año"
          accent="gold"
        />
        <KpiCard
          icon={<CalendarClock className="h-4 w-4" />}
          value={scheduledThisWeek}
          label="Programados · 7 días"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          value={publishedToday}
          label="Publicados hoy"
          accent={publishedToday > 0 ? "success" : undefined}
        />
        <KpiCard
          icon={<Link2 className="h-4 w-4" />}
          value={activeBusinesses.length}
          label="Conexiones activas"
          delta={failedPosts > 0 ? `${failedPosts} con error` : undefined}
          deltaTone="error"
        />
      </div>

      {/* ── Grid: cola + lateral ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Próximas publicaciones */}
        <section aria-labelledby="upcoming-h">
          <div className="flex items-center justify-between mb-3">
            <h2 id="upcoming-h" className="text-base font-semibold text-ink-9">
              Próximas publicaciones
            </h2>
            <span className="font-mono text-xs text-ink-6">
              {queuedTotal === 0 ? "0 en cola" : `${queuedTotal} en cola`}
            </span>
          </div>

          {upcomingPosts.length === 0 ? (
            <Link
              href={ctaHref}
              className="flex flex-col items-center justify-center text-center gap-2 rounded-lg border border-dashed border-ink-5 bg-ink-2 px-6 py-10 hover:border-accent hover:bg-accent-soft transition-colors"
            >
              <Upload className="h-6 w-6 text-ink-6" aria-hidden="true" />
              <p className="text-sm text-ink-8">Suelta una carpeta y la semana se programa sola.</p>
              <span className="text-sm text-accent-strong font-medium">{ctaLabel} →</span>
            </Link>
          ) : (
            <div className="rounded-lg border border-ink-4 bg-ink-2 overflow-hidden">
              {upcomingPosts.map((post, i, arr) => {
                const tz = post.business.timezone ?? "UTC";
                const media = post.mediaAssets[0];
                return (
                  <Link
                    key={post.id}
                    href={`/businesses/${post.business.slug}/posts/${post.id}`}
                    className={`flex items-center gap-3 px-3 h-14 hover:bg-ink-3/60 transition-colors ${
                      i < arr.length - 1 ? "border-b border-ink-4" : ""
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="h-10 w-10 shrink-0 rounded-md bg-ink-3 border border-ink-4 overflow-hidden flex items-center justify-center text-ink-6">
                      {media?.storageUrl && media.mimeType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media.storageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        typeIcon(media?.mimeType, post._count.mediaAssets)
                      )}
                    </div>
                    {/* Caption + marca */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink-9 truncate">
                        {post.caption?.trim() ? post.caption.slice(0, 90) : "Sin texto"}
                      </p>
                      <p className="text-xs text-ink-6 truncate mt-0.5">
                        {post.business.metaConnection?.igUsername
                          ? `@${post.business.metaConnection.igUsername}`
                          : post.business.name}
                      </p>
                    </div>
                    {/* Hora */}
                    <span className="font-mono text-[13px] text-ink-7 tabular-nums shrink-0 hidden sm:block">
                      {shortDateTime(post.publishAt, tz)}
                    </span>
                    {/* Badge */}
                    <StatusDot status={post.status} />
                  </Link>
                );
              })}
              {queuedTotal > upcomingPosts.length && primaryBiz && (
                <Link
                  href={`/businesses/${primaryBiz.slug}/posts`}
                  className="flex items-center justify-center h-11 text-sm text-ink-7 hover:text-ink-9 hover:bg-ink-3 transition-colors border-t border-ink-4"
                >
                  Ver todas ({queuedTotal})
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Lateral */}
        <aside className="flex flex-col gap-6">
          {/* Próximo destacado */}
          {nextPublication && (
            <section className="rounded-lg border border-ink-4 bg-ink-2 p-4">
              <p className="font-mono text-[11px] text-accent-strong uppercase tracking-wider mb-3">
                Próxima publicación
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 rounded-md bg-ink-3 border border-ink-4 overflow-hidden flex items-center justify-center text-ink-6">
                  {nextPublication.mediaAssets[0]?.storageUrl &&
                  nextPublication.mediaAssets[0].mimeType?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={nextPublication.mediaAssets[0].storageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    typeIcon(nextPublication.mediaAssets[0]?.mimeType, nextPublication._count.mediaAssets)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-9 truncate">
                    {nextPublication.business.name}
                  </p>
                  <p className="text-xs text-gold mt-0.5">
                    Sale {formatCountdown(nextPublication.publishAt, now)}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Salud de conexiones */}
          <section className="rounded-lg border border-ink-4 bg-ink-2 p-4">
            <p className="font-mono text-[11px] text-ink-6 uppercase tracking-wider mb-3">
              Conexiones
            </p>
            {!hasBusinesses ? (
              <p className="text-sm text-ink-6">Aún sin canales conectados.</p>
            ) : (
              <div className="flex flex-col divide-y divide-ink-4">
                {businesses.slice(0, 6).map((b) => {
                  const isActive = b.metaConnection?.status === "ACTIVE";
                  const handle = b.metaConnection?.igUsername
                    ? `@${b.metaConnection.igUsername}`
                    : b.name;
                  return (
                    <Link
                      key={b.id}
                      href={`/businesses/${b.slug}/settings`}
                      className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0 group"
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${isActive ? "bg-success" : "bg-ink-5"}`}
                        aria-hidden="true"
                      />
                      <span className="flex-1 text-sm text-ink-8 truncate group-hover:text-ink-9">
                        {handle}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-wide ${isActive ? "text-success" : "text-ink-6"}`}
                      >
                        {isActive ? "Activo" : "—"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ── Componentes ───────────────────────────────────────────────── */

function KpiCard({
  icon,
  value,
  label,
  delta,
  deltaTone = "neutral",
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  delta?: string;
  deltaTone?: "neutral" | "success" | "error";
  accent?: "gold" | "success";
}) {
  const valueColor =
    accent === "gold" ? "text-gold" : accent === "success" ? "text-success" : "text-ink-9";
  const deltaColor =
    deltaTone === "error" ? "text-error" : deltaTone === "success" ? "text-success" : "text-ink-6";
  return (
    <div className="rounded-lg border border-ink-4 bg-ink-2 p-4">
      <div className="text-ink-6 mb-3">{icon}</div>
      <div className={`font-mono text-[28px] font-semibold leading-none tabular-nums tracking-tight ${valueColor}`}>
        {value}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-xs text-ink-7">{label}</span>
        {delta && <span className={`font-mono text-[11px] ${deltaColor}`}>{delta}</span>}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Programado", cls: "bg-info-soft text-info-strong border-info/30" },
    READY: { label: "Listo", cls: "bg-ink-3 text-ink-7 border-ink-4" },
    VALIDATED: { label: "Validado", cls: "bg-ink-3 text-ink-7 border-ink-4" },
    PUBLISHED: { label: "Publicado", cls: "bg-success-soft text-success-strong border-success/30" },
    PUBLISHING: { label: "Publicando", cls: "bg-warning-soft text-warning-strong border-warning/30" },
    FAILED: { label: "Fallido", cls: "bg-error-soft text-error-strong border-error/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-ink-3 text-ink-7 border-ink-4" };
  return (
    <span
      className={`hidden md:inline-flex items-center px-2.5 h-6 rounded-full border text-[11px] font-medium shrink-0 ${s.cls}`}
    >
      {s.label}
    </span>
  );
}
