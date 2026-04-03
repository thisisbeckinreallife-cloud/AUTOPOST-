import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

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
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Audit Logs</h1>
        <p className="text-slate-500 mt-1">{total} entries</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Link href="/logs">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              !actionFilter
                ? "bg-brand-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            All
          </span>
        </Link>
        {allActions.map(({ action }) => (
          <Link key={action} href={`/logs?action=${action}`}>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono cursor-pointer transition-colors ${
                actionFilter === action
                  ? "bg-brand-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {action}
            </span>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No logs found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Business
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                    Entity
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={`border-b border-slate-800/50 last:border-0 ${
                      i % 2 === 0 ? "" : "bg-surface-primary/50"
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-xs">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {log.business ? (
                        <Link
                          href={`/businesses/${log.business.slug}`}
                          className="text-brand-400 hover:underline"
                        >
                          {log.business.name}
                        </Link>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">
                      {log.entityType && (
                        <>
                          {log.entityType}{" "}
                          {log.entityId && (
                            <span className="font-mono">
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/logs?page=${p}${actionFilter ? `&action=${actionFilter}` : ""}`}
            >
              <span
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  p === page
                    ? "bg-brand-500 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {p}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
