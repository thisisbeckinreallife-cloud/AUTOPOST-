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
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-violet/10">
            <FileText className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Registro de actividad</h1>
            <p className="text-zinc-500 mt-0.5">{total} registros</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por accion">
        <Link href="/logs">
          <button
            type="button"
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              !actionFilter
                ? "bg-brand-500 text-white"
                : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
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
              className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                actionFilter === action
                  ? "bg-brand-500 text-white"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
              }`}
              aria-pressed={actionFilter === action}
            >
              {action}
            </button>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-surface-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <FileText className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
            No se encontraron registros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Accion
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Entidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3 text-zinc-500 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs bg-white/[0.04] text-zinc-300 px-2 py-1 rounded-lg font-medium">
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
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">
                      {log.entityType && (
                        <>
                          {log.entityType}{" "}
                          {log.entityId && (
                            <span className="font-mono text-zinc-600">
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
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  p === page
                    ? "bg-brand-500 text-white"
                    : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]"
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
