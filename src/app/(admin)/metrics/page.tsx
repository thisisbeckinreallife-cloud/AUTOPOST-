import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { subDays, startOfDay, startOfYear } from "date-fns";
import {
  CheckCircle, XCircle, TrendingUp, Instagram, Download,
  ArrowUpRight, ArrowDownRight, Minus, Film, Image as ImageIcon, Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Range = "today" | "7d" | "30d" | "ytd";
const RANGE_DAYS: Record<Range, number> = { today: 1, "7d": 7, "30d": 30, ytd: 365 };

function rangeStart(range: Range, now: Date): Date {
  if (range === "today") return startOfDay(now);
  if (range === "7d") return startOfDay(subDays(now, 6));
  if (range === "30d") return startOfDay(subDays(now, 29));
  return startOfYear(now);
}

function previousStart(range: Range, currentStart: Date): Date {
  const days = RANGE_DAYS[range];
  return new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return 0;
  if (previous === 0) return null; // sin comparativa válida
  return Math.round(((current - previous) / previous) * 100);
}

function fmtDelta(d: number | null): string {
  if (d === null) return "—";
  if (d === 0) return "sin cambio";
  return (d > 0 ? "+" : "") + d + "%";
}

async function getMetrics(range: Range) {
  const now = new Date();
  const start = rangeStart(range, now);
  const prevStart = previousStart(range, start);

  const [
    publishedCurrent,
    publishedPrev,
    failedCurrent,
    failedPrev,
    scheduledCurrent,
    typeBreakdown,
    businesses,
    dailyPublished,
  ] = await Promise.all([
    db.postDraft.count({
      where: { status: "PUBLISHED", publishedAt: { gte: start } },
    }),
    db.postDraft.count({
      where: { status: "PUBLISHED", publishedAt: { gte: prevStart, lt: start } },
    }),
    db.postDraft.count({
      where: { status: "FAILED", failedAt: { gte: start } },
    }),
    db.postDraft.count({
      where: { status: "FAILED", failedAt: { gte: prevStart, lt: start } },
    }),
    db.postDraft.count({
      where: { status: "SCHEDULED", publishAt: { gte: now } },
    }),
    db.postDraft.groupBy({
      by: ["postType"],
      where: { status: "PUBLISHED", publishedAt: { gte: start } },
      _count: { id: true },
    }),
    db.business.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        metaConnection: { select: { status: true, igUsername: true } },
        postDrafts: {
          select: { status: true, publishedAt: true, failedAt: true },
        },
      },
    }),
    db.postDraft.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: start } },
      select: { publishedAt: true, businessId: true },
    }),
  ]);

  const totalCurrent = publishedCurrent + failedCurrent;
  const successRate = totalCurrent > 0 ? Math.round((publishedCurrent / totalCurrent) * 100) : 100;
  const totalPrev = publishedPrev + failedPrev;
  const successRatePrev = totalPrev > 0 ? Math.round((publishedPrev / totalPrev) * 100) : 100;
  const days = RANGE_DAYS[range];
  const avgPerDay = days > 0 ? Math.round((publishedCurrent / days) * 10) / 10 : 0;
  const avgPerDayPrev = days > 0 ? Math.round((publishedPrev / days) * 10) / 10 : 0;

  // Daily trend (current range)
  const dayMap: Record<string, number> = {};
  const visibleDays = Math.min(days, 30); // cap chart at 30 bars
  for (let i = 0; i < visibleDays; i++) {
    const key = subDays(now, visibleDays - 1 - i).toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  const chartStart = subDays(now, visibleDays - 1);
  for (const p of dailyPublished) {
    if (!p.publishedAt) continue;
    if (p.publishedAt < chartStart) continue;
    const key = p.publishedAt.toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key]++;
  }
  const dailyTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count }));
  const maxDay = Math.max(...dailyTrend.map((d) => d.count), 1);

  // Type breakdown
  const typeMap: Record<string, number> = { IMAGE: 0, CAROUSEL: 0, REEL: 0 };
  for (const t of typeBreakdown) typeMap[t.postType] = t._count.id;
  const typeTotal = Object.values(typeMap).reduce((a, b) => a + b, 0);

  // Per-business stats with sparkline
  const lastSparkDays = 7;
  const businessStats = businesses.map((biz) => {
    const published = biz.postDrafts.filter((p) => p.status === "PUBLISHED" && p.publishedAt && p.publishedAt >= start).length;
    const failed = biz.postDrafts.filter((p) => p.status === "FAILED" && p.failedAt && p.failedAt >= start).length;
    const total = published + failed;
    const rate = total > 0 ? Math.round((published / total) * 100) : null;
    const lastPost = biz.postDrafts
      .filter((p) => p.status === "PUBLISHED" && p.publishedAt)
      .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))[0];

    // 7-day sparkline
    const spark: number[] = new Array(lastSparkDays).fill(0);
    const sparkStart = subDays(now, lastSparkDays - 1);
    for (const p of biz.postDrafts) {
      if (p.status !== "PUBLISHED" || !p.publishedAt) continue;
      if (p.publishedAt < sparkStart) continue;
      const dayIdx = Math.floor((p.publishedAt.getTime() - startOfDay(sparkStart).getTime()) / (24 * 60 * 60 * 1000));
      if (dayIdx >= 0 && dayIdx < lastSparkDays) spark[dayIdx]++;
    }
    const sparkMax = Math.max(...spark, 1);

    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      igUsername: biz.metaConnection?.igUsername ?? null,
      connectionStatus: biz.metaConnection?.status ?? null,
      published,
      failed,
      rate,
      lastPostAt: lastPost?.publishedAt ?? null,
      spark,
      sparkMax,
    };
  });

  return {
    publishedCurrent,
    publishedPrev,
    failedCurrent,
    failedPrev,
    scheduledCurrent,
    successRate,
    successRatePrev,
    avgPerDay,
    avgPerDayPrev,
    typeMap,
    typeTotal,
    businessStats,
    dailyTrend,
    maxDay,
  };
}

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: { range?: Range; sort?: string };
}) {
  await requireAuth();
  const range: Range = (["today", "7d", "30d", "ytd"] as const).includes(searchParams.range as Range)
    ? (searchParams.range as Range)
    : "30d";
  const sortKey = searchParams.sort ?? "published";

  const m = await getMetrics(range);

  // Sort businesses
  const sorted = m.businessStats.slice().sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "rate") return (b.rate ?? -1) - (a.rate ?? -1);
    if (sortKey === "lastPost") {
      return (b.lastPostAt?.getTime() ?? 0) - (a.lastPostAt?.getTime() ?? 0);
    }
    if (sortKey === "failed") return b.failed - a.failed;
    return b.published - a.published;
  });

  function urlWith(overrides: { range?: Range; sort?: string }): string {
    const qp = new URLSearchParams();
    const r = overrides.range ?? range;
    if (r !== "30d") qp.set("range", r);
    const s = overrides.sort ?? sortKey;
    if (s !== "published") qp.set("sort", s);
    const qs = qp.toString();
    return qs ? `/metrics?${qs}` : "/metrics";
  }

  const publishedDelta = pctDelta(m.publishedCurrent, m.publishedPrev);
  const failedDelta = pctDelta(m.failedCurrent, m.failedPrev);
  const rateDelta = m.successRate - m.successRatePrev;
  const avgDelta = pctDelta(m.avgPerDay, m.avgPerDayPrev);

  const rangeLabels: Record<Range, string> = {
    today: "hoy",
    "7d": "últimos 7 días",
    "30d": "últimos 30 días",
    ytd: "año en curso",
  };

  return (
    <div className="space-y-7 max-w-4xl animate-fade-up">
      {/* Header + range + export */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">Métricas</h1>
          <p className="text-zinc-600 mt-1 text-sm">
            Rendimiento {rangeLabels[range]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white border border-zinc-200 rounded-lg p-1" role="group" aria-label="Rango temporal">
            {(["today", "7d", "30d", "ytd"] as Range[]).map((r) => (
              <Link
                key={r}
                href={urlWith({ range: r })}
                aria-pressed={range === r}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  range === r ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {r === "today" ? "Hoy" : r === "ytd" ? "YTD" : r}
              </Link>
            ))}
          </div>
          <a
            href={`/api/exports/metrics.csv?range=${range}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 text-xs font-semibold hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
            title="Descargar CSV con KPIs y desglose por cuenta del rango actual"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
        </div>
      </div>

      {/* KPI strip with deltas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Publicados"
          value={m.publishedCurrent}
          delta={publishedDelta}
          icon={CheckCircle}
          tone="success"
        />
        <KpiCard
          label="Tasa éxito"
          value={`${m.successRate}%`}
          deltaText={rateDelta === 0 ? "sin cambio" : (rateDelta > 0 ? "+" : "") + rateDelta + " pp"}
          deltaSign={rateDelta > 0 ? 1 : rateDelta < 0 ? -1 : 0}
          icon={TrendingUp}
          tone={m.successRate >= 90 ? "success" : m.successRate >= 70 ? "warning" : "error"}
        />
        <KpiCard
          label="Promedio/día"
          value={m.avgPerDay}
          delta={avgDelta}
          icon={TrendingUp}
          tone="info"
        />
        <KpiCard
          label="Fallos"
          value={m.failedCurrent}
          delta={failedDelta}
          deltaInverse
          icon={XCircle}
          tone={m.failedCurrent > 0 ? "error" : "neutral"}
        />
      </div>

      {/* Daily chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Posts publicados por día
          </h2>
          <p className="text-xs text-zinc-500 tabular-nums">
            Max diario: <span className="font-mono font-semibold text-zinc-900">{m.maxDay}</span>
          </p>
        </div>
        <div className="flex items-end gap-1 h-28">
          {m.dailyTrend.map(({ date, count }) => {
            const heightPct = m.maxDay > 0 ? Math.round((count / m.maxDay) * 100) : 0;
            const isToday = date === new Date().toISOString().slice(0, 10);
            const hasData = count > 0;
            return (
              <div
                key={date}
                title={`${date}: ${count} ${count === 1 ? "publicado" : "publicados"}`}
                className="flex-1 flex flex-col justify-end group cursor-default min-w-0"
              >
                <div
                  className={`w-full rounded-sm transition-all ${
                    !hasData
                      ? "bg-zinc-100"
                      : isToday
                      ? "bg-zinc-900 group-hover:bg-black"
                      : "bg-emerald-500 group-hover:bg-emerald-600"
                  }`}
                  style={{ height: hasData ? `${Math.max(heightPct, 8)}%` : "6px" }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-mono tabular-nums">
          <span>{m.dailyTrend[0]?.date?.slice(5)}</span>
          <span>Hoy</span>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-4">
          Por tipo de contenido
        </h2>
        {m.typeTotal === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">Sin publicaciones en este rango.</p>
        ) : (
          <div className="flex items-center gap-6 flex-wrap">
            <DonutChart
              segments={[
                { label: "REEL", value: m.typeMap.REEL, color: "#7B6DAA" },
                { label: "CAROUSEL", value: m.typeMap.CAROUSEL, color: "#2A7B9B" },
                { label: "IMAGE", value: m.typeMap.IMAGE, color: "#2D8B55" },
              ]}
              total={m.typeTotal}
            />
            <div className="flex-1 min-w-[180px] space-y-2">
              <TypeRow icon={Film} label="Reels" value={m.typeMap.REEL} total={m.typeTotal} color="#7B6DAA" />
              <TypeRow icon={Layers} label="Carruseles" value={m.typeMap.CAROUSEL} total={m.typeTotal} color="#2A7B9B" />
              <TypeRow icon={ImageIcon} label="Imágenes" value={m.typeMap.IMAGE} total={m.typeTotal} color="#2D8B55" />
            </div>
          </div>
        )}
      </div>

      {/* Per-business table */}
      {m.businessStats.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Por cuenta</h2>
            <p className="text-[11px] text-zinc-500">Click columna para ordenar</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                  <SortHeader sortKey="name" current={sortKey} url={urlWith}>Cuenta</SortHeader>
                  <SortHeader sortKey="published" current={sortKey} url={urlWith} numeric>Pub.</SortHeader>
                  <SortHeader sortKey="failed" current={sortKey} url={urlWith} numeric>Err.</SortHeader>
                  <SortHeader sortKey="rate" current={sortKey} url={urlWith} numeric>Éxito</SortHeader>
                  <SortHeader sortKey="lastPost" current={sortKey} url={urlWith} numeric>Último</SortHeader>
                  <th className="px-4 py-3 text-right">7d</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((biz) => (
                  <tr key={biz.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/businesses/${biz.slug}/chat`}
                        className="font-semibold text-zinc-900 hover:underline"
                      >
                        {biz.name}
                      </Link>
                      {biz.igUsername ? (
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Instagram className="h-2.5 w-2.5" />@{biz.igUsername}
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-800 mt-0.5 font-medium">Sin conectar</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-bold text-emerald-700">{biz.published}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={`font-bold ${biz.failed > 0 ? "text-red-700" : "text-zinc-400"}`}>
                        {biz.failed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {biz.rate !== null ? (
                        <span className="font-bold text-zinc-900">{biz.rate}%</span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-zinc-600">
                      {biz.lastPostAt ? relativeTime(biz.lastPostAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Sparkline values={biz.spark} max={biz.sparkMax} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {m.businessStats.length === 0 && (
        <div className="text-center py-12 border border-dashed border-zinc-300 bg-zinc-50 rounded-xl">
          <p className="text-zinc-600 text-sm">Todavía no hay datos. Conecta una cuenta y sube tu primer batch.</p>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

function KpiCard({
  label, value, delta, deltaText, deltaSign, deltaInverse, icon: Icon, tone,
}: {
  label: string;
  value: number | string;
  delta?: number | null;
  deltaText?: string;
  deltaSign?: number;
  deltaInverse?: boolean;
  icon: React.ElementType;
  tone: "success" | "warning" | "error" | "info" | "neutral";
}) {
  const toneMap = {
    success: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
    warning: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    error:   { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200" },
    info:    { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
    neutral: { bg: "bg-zinc-100",   text: "text-zinc-600",   border: "border-zinc-200" },
  }[tone];

  let sign: number | null = deltaSign ?? (delta == null ? null : delta === 0 ? 0 : delta > 0 ? 1 : -1);
  if (deltaInverse && sign !== null && sign !== 0) sign = -sign;
  const Arrow = sign === null ? null : sign > 0 ? ArrowUpRight : sign < 0 ? ArrowDownRight : Minus;
  const deltaColor = sign === null ? "text-zinc-400" : sign > 0 ? "text-emerald-700" : sign < 0 ? "text-red-700" : "text-zinc-500";
  const display = deltaText ?? fmtDelta(delta ?? null);

  return (
    <div className={`rounded-xl border ${toneMap.border} bg-white p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneMap.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${toneMap.text}`} />
        </div>
        <span className="text-xs text-zinc-600 font-semibold">{label}</span>
      </div>
      <p className={`font-display font-bold text-3xl tabular-nums ${toneMap.text}`}>{value}</p>
      <div className={`flex items-center gap-1 mt-1 text-[11px] font-semibold tabular-nums ${deltaColor}`}>
        {Arrow && <Arrow className="h-3 w-3" />}
        <span>{display}</span>
      </div>
    </div>
  );
}

function DonutChart({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const radius = 50;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#F4F4F5" strokeWidth={stroke} />
        {segments.map((s) => {
          if (s.value === 0) return null;
          const len = (s.value / total) * circumference;
          const dash = `${len} ${circumference - len}`;
          const seg = (
            <circle
              key={s.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-display font-bold text-2xl text-zinc-900 tabular-nums">{total}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">posts</span>
      </div>
    </div>
  );
}

function TypeRow({
  icon: Icon, label, value, total, color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-32 shrink-0">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-sm text-zinc-700 font-medium">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-semibold text-zinc-900 tabular-nums w-12 text-right">
        {value}
      </span>
      <span className="text-xs text-zinc-500 tabular-nums w-10 text-right">{pct}%</span>
    </div>
  );
}

function SortHeader({
  sortKey, current, url, numeric, children,
}: {
  sortKey: string;
  current: string;
  url: (o: { sort: string }) => string;
  numeric?: boolean;
  children: React.ReactNode;
}) {
  const isActive = current === sortKey;
  return (
    <th className={`px-4 py-3 ${numeric ? "text-right" : "text-left"}`}>
      <Link
        href={url({ sort: sortKey })}
        className={`inline-flex items-center gap-1 hover:text-zinc-900 transition-colors ${
          isActive ? "text-zinc-900" : ""
        }`}
      >
        {children}
        {isActive && <span className="text-zinc-400">↓</span>}
      </Link>
    </th>
  );
}

function Sparkline({ values, max }: { values: number[]; max: number }) {
  const width = 70;
  const height = 22;
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
  const allZero = values.every((v) => v === 0);

  return (
    <svg width={width} height={height} className="ml-auto block">
      {!allZero && (
        <>
          <polyline points={points} fill="none" stroke="#2D8B55" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((v, i) => v > 0 && (
            <circle key={i} cx={i * step} cy={height - (v / max) * (height - 2) - 1} r="1.5" fill="#2D8B55" />
          ))}
        </>
      )}
      {allZero && (
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#E4E4E7" strokeWidth="1" strokeDasharray="2 2" />
      )}
    </svg>
  );
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `hace ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}mes`;
}
