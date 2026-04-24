import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, List, CalendarRange } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PostsListClient, type PostItem } from "./posts-list-client";
import { CalendarView, type CalendarPost } from "./calendar-view";

export const dynamic = "force-dynamic";

type View = "list" | "calendar";

function parseMonth(m: string | undefined): { year: number; month: number } {
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    return { year: y, month: mo - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { status?: string; page?: string; view?: View; month?: string };
}) {
  await requireSession();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
  });
  if (!business) notFound();

  const view: View = searchParams.view === "calendar" ? "calendar" : "list";
  const page = parseInt(searchParams.page ?? "1", 10);
  const limit = 20;
  const statusFilter = searchParams.status;

  const where = {
    businessId: business.id,
    ...(statusFilter ? { status: statusFilter as never } : {}),
  };

  const STATUS_OPTIONS = [
    "DRAFT", "VALIDATED", "READY", "SCHEDULED",
    "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED",
  ];

  // Calendar view: query month ± 1 to cover grid edges, no paging
  let calendarPosts: CalendarPost[] = [];
  let listPosts: PostItem[] = [];
  let total = 0;
  let pages = 0;

  if (view === "calendar") {
    const { year, month } = parseMonth(searchParams.month);
    const rangeStart = new Date(year, month - 1, 20);
    const rangeEnd = new Date(year, month + 2, 10);
    const rows = await db.postDraft.findMany({
      where: { ...where, publishAt: { gte: rangeStart, lt: rangeEnd } },
      orderBy: { publishAt: "asc" },
      include: {
        _count: { select: { mediaAssets: true } },
        mediaAssets: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { storageUrl: true, mimeType: true },
        },
      },
    });
    calendarPosts = rows.map((p) => ({
      id: p.id,
      postType: p.postType,
      caption: p.caption,
      publishAt: p.publishAt,
      status: p.status,
      mediaCount: p._count.mediaAssets,
      firstMedia: p.mediaAssets[0]
        ? { storageUrl: p.mediaAssets[0].storageUrl, mimeType: p.mediaAssets[0].mimeType }
        : null,
    }));
    total = calendarPosts.length;
  } else {
    const [rows, t] = await Promise.all([
      db.postDraft.findMany({
        where,
        orderBy: { publishAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { mediaAssets: true } },
          mediaAssets: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: { storageUrl: true, mimeType: true },
          },
        },
      }),
      db.postDraft.count({ where }),
    ]);
    total = t;
    pages = Math.ceil(total / limit);
    listPosts = rows.map((p) => ({
      id: p.id,
      postType: p.postType,
      sourceFolderName: p.sourceFolderName,
      caption: p.caption,
      publishAt: p.publishAt.toISOString(),
      status: p.status,
      mediaCount: p._count.mediaAssets,
      firstMedia: p.mediaAssets[0]
        ? { storageUrl: p.mediaAssets[0].storageUrl, mimeType: p.mediaAssets[0].mimeType }
        : null,
    }));
  }

  const slug = params.slug;
  function urlWith(overrides: Partial<{ view: View; status: string | null; month: string }>): string {
    const qp = new URLSearchParams();
    const v = overrides.view ?? view;
    if (v === "calendar") qp.set("view", "calendar");
    const s = overrides.status === null ? null : overrides.status ?? statusFilter;
    if (s) qp.set("status", s);
    const m = overrides.month ?? searchParams.month;
    if (m && v === "calendar") qp.set("month", m);
    const qs = qp.toString();
    return qs ? `/businesses/${slug}/posts?${qs}` : `/businesses/${slug}/posts`;
  }

  const preservedQuery = new URLSearchParams();
  if (statusFilter) preservedQuery.set("status", statusFilter);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Inicio", href: "/dashboard" },
        { label: business.name, href: `/businesses/${params.slug}` },
        { label: "Posts" },
      ]} />

      <div className="flex items-start justify-between animate-fade-up gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-zinc-900">
            {business.name} — Posts
          </h1>
          <p className="text-zinc-600 mt-1 text-sm">
            <span className="text-zinc-900 font-semibold">{total}</span> post{total !== 1 ? "s" : ""}
            {statusFilter && <> · filtrado por {statusFilter}</>}
            {view === "calendar" && <> · vista calendario</>}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-white border border-zinc-200 rounded-lg p-1" role="group" aria-label="Vista">
          <Link
            href={urlWith({ view: "list" })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              view === "list" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
            }`}
            aria-pressed={view === "list"}
          >
            <List className="h-3.5 w-3.5" />
            Lista
          </Link>
          <Link
            href={urlWith({ view: "calendar" })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              view === "calendar" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
            }`}
            aria-pressed={view === "calendar"}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Calendario
          </Link>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
        <Link
          href={`/businesses/${params.slug}/posts`}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            !statusFilter
              ? "bg-zinc-900 text-white border-zinc-900"
              : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
          }`}
          aria-pressed={!statusFilter}
        >
          Todos
        </Link>
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/businesses/${params.slug}/posts?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border font-mono ${
              statusFilter === s
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
            aria-pressed={statusFilter === s}
          >
            {s}
          </Link>
        ))}
      </div>

      {view === "calendar" ? (
        <CalendarView
          posts={calendarPosts}
          slug={params.slug}
          timezone={business.timezone}
          monthParam={searchParams.month}
          preservedQuery={preservedQuery.toString()}
        />
      ) : listPosts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">No se encontraron posts</h3>
          <p className="text-zinc-600 text-sm">Prueba cambiando los filtros</p>
        </div>
      ) : (
        <PostsListClient posts={listPosts} slug={params.slug} timezone={business.timezone} />
      )}

      {/* Pagination */}
      {view === "list" && pages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1 justify-center pt-4 pb-24">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/businesses/${params.slug}/posts?page=${p}${
                statusFilter ? `&status=${statusFilter}` : ""
              }`}
              aria-current={p === page ? "page" : undefined}
              className={`inline-block px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                p === page
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
