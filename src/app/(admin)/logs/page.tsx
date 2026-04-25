import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FileText, Search, Calendar, X } from "lucide-react";
import { CopyIdButton } from "@/components/admin/copy-id-button";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Category = "all" | "content" | "meta" | "system";
type Range = "all" | "today" | "7d" | "30d";

const CATEGORIES: Array<{ key: Category; label: string; prefixes: string[] }> = [
  { key: "all", label: "Todos", prefixes: [] },
  { key: "content", label: "Contenido", prefixes: ["POST_", "BATCH_"] },
  { key: "meta", label: "Meta / IG", prefixes: ["META_"] },
  { key: "system", label: "Sistema", prefixes: ["BUSINESS_", "SEED_", "ADMIN_"] },
];

function categoryFor(action: string): Category {
  for (const c of CATEGORIES) {
    if (c.key === "all") continue;
    if (c.prefixes.some((p) => action.startsWith(p))) return c.key;
  }
  return "system";
}

function rangeStart(range: Range): Date | null {
  const now = new Date();
  if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

function actionTone(action: string): string {
  if (action.includes("FAILED") || action.includes("DELETED") || action.includes("REVOKED") || action.includes("ERROR")) {
    return "bg-red-100 text-red-800 border-red-300";
  }
  if (action.includes("PUBLISHED") || action.includes("CREATED") || action.includes("CONFIRMED")) {
    return "bg-green-100 text-green-800 border-green-300";
  }
  if (action.includes("UPDATED") || action.includes("SCHEDULED") || action.includes("UPLOADED")) {
    return "bg-blue-100 text-blue-800 border-blue-300";
  }
  return "bg-zinc-100 text-zinc-700 border-zinc-300";
}

function groupByDay(logs: Array<{ createdAt: Date }>): Map<string, number[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const groups = new Map<string, number[]>();
  groups.set("Hoy", []);
  groups.set("Ayer", []);
  groups.set("Esta semana", []);
  groups.set("Más antiguo", []);

  logs.forEach((log, i) => {
    const d = log.createdAt;
    if (d >= startOfToday) groups.get("Hoy")!.push(i);
    else if (d >= startOfYesterday) groups.get("Ayer")!.push(i);
    else if (d >= startOfWeek) groups.get("Esta semana")!.push(i);
    else groups.get("Más antiguo")!.push(i);
  });

  return groups;
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { page?: string; action?: string; category?: Category; range?: Range; q?: string };
}) {
  await requireSession();

  const page = parseInt(searchParams.page ?? "1", 10);
  const limit = 50;
  const actionFilter = searchParams.action;
  const category: Category = searchParams.category ?? "all";
  const range: Range = searchParams.range ?? "all";
  const q = (searchParams.q ?? "").trim();

  // Build where clause — combine filters as AND of OR-groups when needed.
  const andClauses: Prisma.AuditLogWhereInput[] = [];

  if (actionFilter) andClauses.push({ action: actionFilter });

  if (category !== "all") {
    const cat = CATEGORIES.find((c) => c.key === category)!;
    andClauses.push({
      OR: cat.prefixes.map((p) => ({ action: { startsWith: p } })),
    });
  }

  const start = rangeStart(range);
  if (start) andClauses.push({ createdAt: { gte: start } });

  if (q) {
    andClauses.push({
      OR: [
        { entityId: { contains: q, mode: "insensitive" } },
        { action: { contains: q.toUpperCase() } },
      ],
    });
  }

  const where: Prisma.AuditLogWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

  const [logs, total, allActions] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        business: { select: { name: true, slug: true } },
      },
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ select: { action: true }, distinct: ["action"], orderBy: { action: "asc" } }),
  ]);

  const pages = Math.ceil(total / limit);
  const grouped = groupByDay(logs);

  function urlWith(overrides: Partial<{ page: number; action: string | null; category: Category; range: Range; q: string }>): string {
    const params = new URLSearchParams();
    const p = overrides.page ?? 1;
    if (p > 1) params.set("page", String(p));
    const a = overrides.action === null ? null : overrides.action ?? actionFilter;
    if (a) params.set("action", a);
    const c = overrides.category ?? category;
    if (c !== "all") params.set("category", c);
    const r = overrides.range ?? range;
    if (r !== "all") params.set("range", r);
    const qv = overrides.q ?? q;
    if (qv) params.set("q", qv);
    const s = params.toString();
    return s ? `/logs?${s}` : "/logs";
  }

  // Only show actions that belong to the current category (or all)
  const visibleActions = category === "all"
    ? allActions
    : allActions.filter(({ action }) => categoryFor(action) === category);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200">
          <FileText className="h-5 w-5 text-zinc-700" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-zinc-900">Actividad</h1>
          <p className="text-zinc-600 text-sm mt-0.5">
            {total} {total === 1 ? "registro" : "registros"}
            {(actionFilter || category !== "all" || range !== "all" || q) && " (filtrado)"}
          </p>
        </div>
      </div>

      {/* Search + Range */}
      <form className="flex flex-col sm:flex-row gap-2" action="/logs" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por ID o texto de acción..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          />
          {q && (
            <Link
              href={urlWith({ q: "", page: 1 })}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100"
              title="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5 text-zinc-500" />
            </Link>
          )}
        </div>
        {category !== "all" && <input type="hidden" name="category" value={category} />}
        {range !== "all" && <input type="hidden" name="range" value={range} />}

        <div className="flex gap-1 bg-white border border-zinc-200 rounded-lg p-1" role="group" aria-label="Rango de fechas">
          {(["today", "7d", "30d", "all"] as Range[]).map((r) => (
            <Link
              key={r}
              href={urlWith({ range: r, page: 1 })}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                range === r ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
              }`}
              aria-pressed={range === r}
            >
              {r === "today" ? "Hoy" : r === "all" ? "Todo" : r}
            </Link>
          ))}
        </div>
      </form>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Categoría">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={urlWith({ category: c.key, action: null, page: 1 })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              category === c.key
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
            aria-pressed={category === c.key}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {/* Action sub-filters (only visible if a specific action is useful) */}
      {visibleActions.length > 0 && visibleActions.length < 10 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Acción específica">
          <Link
            href={urlWith({ action: null, page: 1 })}
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
              !actionFilter ? "bg-zinc-200 text-zinc-900" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            Todas
          </Link>
          {visibleActions.map(({ action }) => (
            <Link
              key={action}
              href={urlWith({ action, page: 1 })}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                actionFilter === action ? "bg-zinc-200 text-zinc-900" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {action}
            </Link>
          ))}
        </div>
      )}

      {/* Log table grouped by day */}
      {logs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center">
          <FileText className="h-8 w-8 mx-auto mb-3 text-zinc-400" />
          <p className="text-zinc-500 text-sm">No se encontraron registros con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([dayLabel, indexes]) => {
            if (indexes.length === 0) return null;
            return (
              <div key={dayLabel}>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 px-1">
                  {dayLabel} · {indexes.length}
                </h2>
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {indexes.map((idx) => {
                        const log = logs[idx];
                        return (
                          <tr
                            key={log.id}
                            className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-zinc-600 whitespace-nowrap text-xs tabular-nums w-[160px]">
                              {formatDate(log.createdAt)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`font-mono text-[11px] px-2 py-0.5 rounded border font-semibold ${actionTone(log.action)}`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-sm">
                              {log.business ? (
                                <Link
                                  href={`/businesses/${log.business.slug}`}
                                  className="text-zinc-900 hover:underline font-medium"
                                >
                                  {log.business.name}
                                </Link>
                              ) : (
                                <span className="text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-zinc-600 text-xs">
                              {log.entityType && (
                                <span className="inline-flex items-center gap-2">
                                  <span className="text-zinc-500">{log.entityType}</span>
                                  {log.entityId && <CopyIdButton value={log.entityId} label="ID de entidad" />}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1 justify-center pt-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={urlWith({ page: p })} aria-current={p === page ? "page" : undefined}>
              <span
                className={`inline-block px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  p === page ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {p}
              </span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
