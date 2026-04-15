import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { subDays, startOfDay } from "date-fns";
import { CheckCircle, XCircle, Clock, FileText, TrendingUp, Instagram } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMetrics() {
  const now = new Date();
  const thirtyDaysAgo = startOfDay(subDays(now, 29));

  const [statusCounts, businesses, dailyPublished] = await Promise.all([
    db.postDraft.groupBy({ by: ["status"], _count: { id: true } }),
    db.business.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        metaConnection: { select: { status: true, igUsername: true } },
        postDrafts: { select: { status: true } },
      },
    }),
    db.postDraft.findMany({
      where: { status: "PUBLISHED", publishedAt: { gte: thirtyDaysAgo } },
      select: { publishedAt: true },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const row of statusCounts) statusMap[row.status] = row._count.id;

  const totalPublished = statusMap["PUBLISHED"] ?? 0;
  const totalFailed = statusMap["FAILED"] ?? 0;
  const totalScheduled = statusMap["SCHEDULED"] ?? 0;
  const totalDraft = (statusMap["DRAFT"] ?? 0) + (statusMap["VALIDATED"] ?? 0) + (statusMap["READY"] ?? 0);
  const successRate = Math.round((totalPublished / Math.max(totalPublished + totalFailed, 1)) * 100);

  const businessStats = businesses.map((biz) => ({
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    igUsername: biz.metaConnection?.igUsername ?? null,
    connectionStatus: biz.metaConnection?.status ?? null,
    published: biz.postDrafts.filter((p) => p.status === "PUBLISHED").length,
    failed: biz.postDrafts.filter((p) => p.status === "FAILED").length,
    scheduled: biz.postDrafts.filter((p) => p.status === "SCHEDULED").length,
    total: biz.postDrafts.length,
  }));

  // Build 30-day trend
  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const key = subDays(now, 29 - i).toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  for (const post of dailyPublished) {
    if (post.publishedAt) {
      const key = post.publishedAt.toISOString().slice(0, 10);
      if (key in dayMap) dayMap[key]++;
    }
  }
  const dailyTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count }));
  const maxDay = Math.max(...dailyTrend.map((d) => d.count), 1);

  return { totalPublished, totalFailed, totalScheduled, totalDraft, successRate, businessStats, dailyTrend, maxDay };
}

export default async function MetricsPage() {
  await requireSession();
  const { totalPublished, totalFailed, totalScheduled, totalDraft, successRate, businessStats, dailyTrend, maxDay } = await getMetrics();

  const kpis = [
    { label: "Publicados", value: totalPublished, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/8 border-green-500/12" },
    { label: "Fallidos", value: totalFailed, icon: XCircle, color: "text-red-400", bg: "bg-red-500/8 border-red-500/12" },
    { label: "Programados", value: totalScheduled, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/12" },
    { label: "Borradores", value: totalDraft, icon: FileText, color: "text-zinc-400", bg: "bg-zinc-500/8 border-zinc-500/12" },
  ];

  return (
    <div className="space-y-8 max-w-4xl animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Métricas</h1>
        <p className="text-zinc-500 mt-1 text-sm">Resumen de rendimiento de todas tus cuentas</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-zinc-500 font-medium">{label}</span>
            </div>
            <p className={`font-display font-bold text-3xl tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Success rate */}
      <div className="rounded-xl border border-brand-500/15 bg-brand-500/[0.04] p-5 flex items-center gap-4">
        <TrendingUp className="h-6 w-6 text-brand-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-300 mb-1">Tasa de éxito global</p>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-orange rounded-full transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
        <span className="font-display font-bold text-2xl text-brand-300 tabular-nums shrink-0">{successRate}%</span>
      </div>

      {/* 30-day bar chart */}
      <div className="rounded-xl border border-white/[0.06] bg-surface-card p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Posts publicados — últimos 30 días</h2>
        <div className="flex items-end gap-1 h-24">
          {dailyTrend.map(({ date, count }) => {
            const heightPct = maxDay > 0 ? Math.round((count / maxDay) * 100) : 0;
            const isToday = date === new Date().toISOString().slice(0, 10);
            return (
              <div
                key={date}
                title={`${date}: ${count} publicados`}
                className="flex-1 flex flex-col justify-end group cursor-default"
              >
                <div
                  className={`w-full rounded-sm transition-all group-hover:opacity-100 ${
                    count === 0
                      ? "bg-white/[0.04]"
                      : isToday
                      ? "bg-brand-400"
                      : "bg-brand-500/60 group-hover:bg-brand-500"
                  }`}
                  style={{ height: count === 0 ? "4px" : `${Math.max(heightPct, 8)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-zinc-700">
          <span>{dailyTrend[0]?.date?.slice(5)}</span>
          <span>Hoy</span>
        </div>
      </div>

      {/* Per-business table */}
      {businessStats.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-surface-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.04]">
            <h2 className="text-sm font-semibold text-zinc-300">Por cuenta</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {businessStats.map((biz) => {
              const rate = biz.total > 0 ? Math.round((biz.published / Math.max(biz.published + biz.failed, 1)) * 100) : null;
              return (
                <div key={biz.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{biz.name}</p>
                    {biz.igUsername ? (
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Instagram className="h-3 w-3" />@{biz.igUsername}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-400/70 mt-0.5">Sin conectar</p>
                    )}
                  </div>
                  <div className="flex items-center gap-5 shrink-0 text-center">
                    <div>
                      <p className="text-sm font-bold text-green-400 tabular-nums">{biz.published}</p>
                      <p className="text-[10px] text-zinc-600">pub.</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-400 tabular-nums">{biz.failed}</p>
                      <p className="text-[10px] text-zinc-600">err.</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-400 tabular-nums">{biz.scheduled}</p>
                      <p className="text-[10px] text-zinc-600">prog.</p>
                    </div>
                    {rate !== null && (
                      <div className="hidden sm:block">
                        <p className="text-sm font-bold text-brand-400 tabular-nums">{rate}%</p>
                        <p className="text-[10px] text-zinc-600">éxito</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {businessStats.length === 0 && (
        <div className="text-center py-12 border border-dashed border-white/[0.06] bg-surface-card/50 rounded-xl">
          <p className="text-zinc-500 text-sm">Todavía no hay datos. Conecta una cuenta y sube tu primer batch.</p>
        </div>
      )}
    </div>
  );
}
