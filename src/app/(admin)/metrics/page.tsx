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

  // Build 30-day trend — use PUBLISHED postDrafts where publishedAt falls in last 30d
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
    {
      label: "Publicados",
      value: totalPublished,
      icon: CheckCircle,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-700",
      valueColor: "text-emerald-700",
      border: "border-emerald-200",
    },
    {
      label: "Fallidos",
      value: totalFailed,
      icon: XCircle,
      iconBg: totalFailed > 0 ? "bg-red-100" : "bg-zinc-100",
      iconColor: totalFailed > 0 ? "text-red-700" : "text-zinc-500",
      valueColor: totalFailed > 0 ? "text-red-700" : "text-zinc-900",
      border: totalFailed > 0 ? "border-red-200" : "border-zinc-200",
    },
    {
      label: "Programados",
      value: totalScheduled,
      icon: Clock,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      valueColor: "text-blue-700",
      border: "border-blue-200",
    },
    {
      label: "Borradores",
      value: totalDraft,
      icon: FileText,
      iconBg: "bg-zinc-100",
      iconColor: "text-zinc-700",
      valueColor: "text-zinc-900",
      border: "border-zinc-200",
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">Métricas</h1>
        <p className="text-zinc-600 mt-1 text-sm">Resumen de rendimiento de todas tus cuentas</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor, border }) => (
          <div key={label} className={`rounded-xl border bg-white p-4 ${border} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
              </div>
              <span className="text-xs text-zinc-600 font-semibold">{label}</span>
            </div>
            <p className={`font-display font-bold text-3xl tabular-nums ${valueColor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Success rate */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 shrink-0">
          <TrendingUp className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-900 mb-1">Tasa de éxito global</p>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>
        <span className="font-display font-bold text-2xl text-emerald-700 tabular-nums shrink-0">{successRate}%</span>
      </div>

      {/* 30-day bar chart */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-900">Posts publicados — últimos 30 días</h2>
          <p className="text-xs text-zinc-500 tabular-nums">
            Max. diario: <span className="font-mono font-semibold text-zinc-900">{maxDay}</span>
          </p>
        </div>
        <div className="flex items-end gap-1 h-28">
          {dailyTrend.map(({ date, count }) => {
            const heightPct = maxDay > 0 ? Math.round((count / maxDay) * 100) : 0;
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
          <span>{dailyTrend[0]?.date?.slice(5)}</span>
          <span>Hoy</span>
        </div>
      </div>

      {/* Per-business table */}
      {businessStats.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200">
            <h2 className="text-sm font-semibold text-zinc-900">Por cuenta</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {businessStats.map((biz) => {
              const rate = biz.total > 0 ? Math.round((biz.published / Math.max(biz.published + biz.failed, 1)) * 100) : null;
              return (
                <div key={biz.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{biz.name}</p>
                    {biz.igUsername ? (
                      <p className="text-xs text-zinc-600 flex items-center gap-1 mt-0.5">
                        <Instagram className="h-3 w-3" />@{biz.igUsername}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-800 mt-0.5 font-medium">Sin conectar</p>
                    )}
                  </div>
                  <div className="flex items-center gap-5 shrink-0 text-center">
                    <div title="Publicados">
                      <p className="text-sm font-bold text-emerald-700 tabular-nums">{biz.published}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">pub.</p>
                    </div>
                    <div title="Con errores">
                      <p className={`text-sm font-bold tabular-nums ${biz.failed > 0 ? "text-red-700" : "text-zinc-400"}`}>
                        {biz.failed}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-medium">err.</p>
                    </div>
                    <div title="Programados">
                      <p className="text-sm font-bold text-blue-700 tabular-nums">{biz.scheduled}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">prog.</p>
                    </div>
                    {rate !== null && (
                      <div className="hidden sm:block" title="Tasa éxito">
                        <p className="text-sm font-bold text-zinc-900 tabular-nums">{rate}%</p>
                        <p className="text-[10px] text-zinc-500 font-medium">éxito</p>
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
        <div className="text-center py-12 border border-dashed border-zinc-300 bg-zinc-50 rounded-xl">
          <p className="text-zinc-600 text-sm">Todavía no hay datos. Conecta una cuenta y sube tu primer batch.</p>
        </div>
      )}
    </div>
  );
}
