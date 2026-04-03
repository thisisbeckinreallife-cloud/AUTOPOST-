import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { page?: string; action?: string };
}) {
  await requireSession();

  const page = parseInt(searchParams.page ?? "1", 10);
  const limit = 50;
  const actionFilter = searchParams.action;

  const where = actionFilter ? { action: actionFilter } : {};

  const [logs, total] = await Promise.all([
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
  ]);

  const pages = Math.ceil(total / limit);

  const allActions = await db.auditLog.findMany({
    select: { action: true },
    distinct: ["action"],
    orderBy: { action: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="animate-stagger-in delay-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
            <FileText className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-100">Registro de actividad</h1>
            <p className="text-slate-500 mt-0.5">{total} registros</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 animate-stagger-in delay-1" role="group" aria-label="Filtrar por accion">
        <Link href="/logs">
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              !actionFilter
                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
            aria-pressed={!actionFilter}
          >
            Todos
          </button>
        </Link>
        {allActions.map(({ action }) => (
          <Link key={action} href={`/logs?action=${action}`}>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 ${
                actionFilter === action
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
              aria-pressed={actionFilter === action}
            >
              {action}
            </button>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800/80 bg-surface-card overflow-hidden animate-card-appear delay-2">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <FileText className="h-8 w-8 mx-auto mb-3 text-slate-600" />
            No se encontraron registros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Accion
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Entidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-b border-slate-800/30 last:border-0 hover:bg-white/[0.02] transition-colors animate-stagger-in delay-${Math.min(i, 8)}`}
                  >
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-lg font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {log.business ? (
                        <Link
                          href={`/businesses/${log.business.slug}`}
                          className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                        >
                          {log.business.name}
                        </Link>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {log.entityType && (
                        <>
                          {log.entityType}{" "}
                          {log.entityId && (
                            <span className="font-mono text-slate-600">
                              {log.entityId.slice(0, 8)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <nav aria-label="Paginacion" className="flex items-center gap-2 justify-center pt-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/logs?page=${p}${actionFilter ? `&action=${actionFilter}` : ""}`}
              aria-current={p === page ? "page" : undefined}
            >
              <span
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  p === page
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
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
