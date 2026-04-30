import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import {
  Plus, Instagram, CheckCircle, AlertCircle, ChevronRight,
  Upload, FileText, Calendar, XCircle, Search, X,
} from "lucide-react";
import { startOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

type SortKey = "recent" | "name" | "active" | "token";
type Filter = "all" | "connected" | "disconnected" | "expiring";

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: SortKey; filter?: Filter };
}) {
  await requireAuth();

  const monthStart = startOfMonth(new Date());
  const q = (searchParams.q ?? "").trim();
  const sort: SortKey = searchParams.sort ?? "recent";
  const filter: Filter = searchParams.filter ?? "all";

  const businesses = await db.business.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { metaConnection: { igUsername: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      metaConnection: { select: { igUsername: true, status: true, tokenExpiresAt: true } },
      postDrafts: {
        select: { status: true, publishAt: true },
      },
    },
  });

  const now = new Date();

  const enriched = businesses.map((biz) => {
    const published = biz.postDrafts.filter((p) => p.status === "PUBLISHED").length;
    const publishedThisMonth = biz.postDrafts.filter(
      (p) => p.status === "PUBLISHED" && p.publishAt >= monthStart
    ).length;
    const failed = biz.postDrafts.filter((p) => p.status === "FAILED").length;
    const scheduled = biz.postDrafts.filter((p) => p.status === "SCHEDULED").length;
    const total = biz.postDrafts.length;
    const connectionStatus = biz.metaConnection?.status ?? null;
    const igUsername = biz.metaConnection?.igUsername ?? null;
    const tokenExpiresAt = biz.metaConnection?.tokenExpiresAt ?? null;
    const tokenDaysLeft = tokenExpiresAt
      ? Math.floor((tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const lastActivity = biz.postDrafts.reduce<Date | null>((max, p) => {
      if (!max || p.publishAt > max) return p.publishAt;
      return max;
    }, null);

    return {
      ...biz,
      published,
      publishedThisMonth,
      failed,
      scheduled,
      total,
      connectionStatus,
      igUsername,
      tokenDaysLeft,
      lastActivity,
    };
  });

  // Apply filter
  const filtered = enriched.filter((b) => {
    if (filter === "all") return true;
    if (filter === "connected") return b.connectionStatus === "ACTIVE";
    if (filter === "disconnected") return b.connectionStatus !== "ACTIVE";
    if (filter === "expiring") return b.tokenDaysLeft !== null && b.tokenDaysLeft < 30;
    return true;
  });

  // Apply sort
  const sorted = filtered.slice().sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "active") {
      const aT = a.lastActivity?.getTime() ?? 0;
      const bT = b.lastActivity?.getTime() ?? 0;
      return bT - aT;
    }
    if (sort === "token") {
      const aD = a.tokenDaysLeft ?? Infinity;
      const bD = b.tokenDaysLeft ?? Infinity;
      return aD - bD;
    }
    // recent (default) = by createdAt desc (already ordered)
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  function tokenBadge(daysLeft: number | null) {
    if (daysLeft === null) return null;
    if (daysLeft < 7) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold border border-red-300"
          title={`El token expira en ${daysLeft} ${daysLeft === 1 ? "día" : "días"}`}
        >
          Token: {daysLeft}d
        </span>
      );
    }
    if (daysLeft < 30) {
      return (
        <span
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300"
          title={`El token expira en ${daysLeft} días`}
        >
          Token: {daysLeft}d
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-medium border border-zinc-300"
        title={`Token válido ${daysLeft} días más`}
      >
        Token: {daysLeft > 90 ? "90d+" : `${daysLeft}d`}
      </span>
    );
  }

  function connectionBadge(status: string | null) {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold border border-green-300">
          <CheckCircle className="h-2.5 w-2.5" />
          Conectado
        </span>
      );
    }
    if (status === "TOKEN_EXPIRED" || status === "ERROR") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold border border-red-300">
          <XCircle className="h-2.5 w-2.5" />
          Token expirado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300">
        <AlertCircle className="h-2.5 w-2.5" />
        Sin conectar
      </span>
    );
  }

  function urlWith(overrides: Partial<{ q: string; sort: SortKey; filter: Filter }>): string {
    const qp = new URLSearchParams();
    const nq = overrides.q ?? q;
    if (nq) qp.set("q", nq);
    const ns = overrides.sort ?? sort;
    if (ns !== "recent") qp.set("sort", ns);
    const nf = overrides.filter ?? filter;
    if (nf !== "all") qp.set("filter", nf);
    const qs = qp.toString();
    return qs ? `/businesses?${qs}` : "/businesses";
  }

  const totalCount = businesses.length;
  const showCount = sorted.length;
  const hasFilters = q || filter !== "all" || sort !== "recent";

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 tracking-tight">Mis cuentas</h1>
          <p className="text-zinc-600 mt-1 text-sm">
            {hasFilters ? (
              <>
                <span className="text-zinc-900 font-semibold">{showCount}</span> de {totalCount} cuenta{totalCount !== 1 ? "s" : ""}
              </>
            ) : (
              <>{totalCount} cuenta{totalCount !== 1 ? "s" : ""} gestionadas</>
            )}
          </p>
        </div>
        <Link
          href="/businesses/new"
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Añadir cuenta
        </Link>
      </div>

      {/* Search + Filters + Sort (only shown when there's something to filter) */}
      {totalCount > 0 && (
        <div className="space-y-3 animate-fade-up">
          <form action="/businesses" method="get" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, slug o @handle..."
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-white border border-zinc-200 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />
            {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
            {sort !== "recent" && <input type="hidden" name="sort" value={sort} />}
            {q && (
              <Link
                href={urlWith({ q: "" })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-100"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5 text-zinc-500" />
              </Link>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtros">
              {([
                { key: "all" as const, label: "Todas" },
                { key: "connected" as const, label: "Conectadas" },
                { key: "disconnected" as const, label: "Sin conectar" },
                { key: "expiring" as const, label: "Token por expirar" },
              ]).map((f) => (
                <Link
                  key={f.key}
                  href={urlWith({ filter: f.key })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    filter === f.key
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                  aria-pressed={filter === f.key}
                >
                  {f.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-xs text-zinc-600 font-medium">
                Ordenar
              </label>
              <div className="flex gap-1 bg-white border border-zinc-200 rounded-lg p-1">
                {([
                  { key: "recent" as const, label: "Añadido" },
                  { key: "name" as const, label: "Nombre" },
                  { key: "active" as const, label: "Actividad" },
                  { key: "token" as const, label: "Token" },
                ]).map((s) => (
                  <Link
                    key={s.key}
                    href={urlWith({ sort: s.key })}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      sort === s.key ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                    aria-pressed={sort === s.key}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {sorted.length === 0 && totalCount > 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 bg-white rounded-2xl">
          <Search className="h-7 w-7 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-900 mb-1">Nada coincide con tus filtros</p>
          <p className="text-xs text-zinc-600 mb-3">
            Prueba limpiando la búsqueda o cambiando el filtro
          </p>
          <Link
            href="/businesses"
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:underline"
          >
            Resetear filtros
          </Link>
        </div>
      ) : enriched.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-300 bg-white rounded-2xl animate-fade-up stagger-1">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-200 flex items-center justify-center mx-auto mb-4">
            <Instagram className="h-7 w-7 text-zinc-700" />
          </div>
          <h3 className="font-display text-lg font-bold text-zinc-900 mb-1.5">Tu lista de cuentas está vacía</h3>
          <p className="text-zinc-600 text-sm mb-6 max-w-xs mx-auto">
            Conecta tu primera cuenta de Instagram y empieza a programar publicaciones
          </p>
          <Link
            href="/businesses/new"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="h-4 w-4" />
            Añadir cuenta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((biz, i) => {
            const needsConnect = !biz.connectionStatus || biz.connectionStatus !== "ACTIVE";
            return (
              <div
                key={biz.id}
                className={`rounded-xl border bg-white overflow-hidden transition-all card-interactive animate-fade-up ${
                  needsConnect ? "border-amber-300" : "border-zinc-200 hover:border-zinc-300 hover:shadow-md"
                }`}
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {/* Main row */}
                <Link href={`/businesses/${biz.slug}/chat`} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 border border-zinc-200 flex items-center justify-center shrink-0">
                    <span className="text-zinc-900 font-display font-bold text-base uppercase">
                      {biz.name[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-900">{biz.name}</p>
                      {connectionBadge(biz.connectionStatus)}
                      {biz.connectionStatus === "ACTIVE" && tokenBadge(biz.tokenDaysLeft)}
                    </div>
                    {biz.igUsername ? (
                      <p className="text-sm text-zinc-600 flex items-center gap-1.5 mt-0.5">
                        <Instagram className="h-3 w-3" />
                        @{biz.igUsername}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500 mt-0.5">Sin cuenta Instagram vinculada</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5 shrink-0 text-center">
                    <div title="Publicados este mes">
                      <p className="text-base font-display font-bold text-green-700 tabular-nums">{biz.publishedThisMonth}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">este mes</p>
                    </div>
                    <div title="Programados futuros">
                      <p className="text-base font-display font-bold text-blue-700 tabular-nums">{biz.scheduled}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">prog.</p>
                    </div>
                    {biz.failed > 0 && (
                      <div title="Con error">
                        <p className="text-base font-display font-bold text-red-700 tabular-nums">{biz.failed}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">errores</p>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
                </Link>

                {/* Quick actions row */}
                <div className="flex items-center gap-1 px-5 py-2.5 border-t border-zinc-100 bg-zinc-50">
                  {needsConnect ? (
                    <Link
                      href={`/businesses/${biz.slug}/connect`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      {biz.connectionStatus === "TOKEN_EXPIRED" ? "Reconectar Instagram" : "Conectar Instagram"}
                    </Link>
                  ) : (
                    <Link
                      href={`/businesses/${biz.slug}/chat`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 hover:text-black px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Subir con IA
                    </Link>
                  )}
                  <Link
                    href={`/businesses/${biz.slug}/batches`}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Subidas
                  </Link>
                  <Link
                    href={`/businesses/${biz.slug}/posts`}
                    className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Posts ({biz.total})
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
