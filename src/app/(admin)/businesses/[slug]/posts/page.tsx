import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { Image, Film, Layers, Search } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

const POST_TYPE_ICON: Record<string, React.ReactNode> = {
  IMAGE: <Image className="h-4 w-4 text-green-400" />,
  CAROUSEL: <Layers className="h-4 w-4 text-blue-400" />,
  REEL: <Film className="h-4 w-4 text-purple-400" />,
};

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { status?: string; page?: string };
}) {
  await requireSession();

  const business = await db.business.findUnique({
    where: { slug: params.slug },
  });
  if (!business) notFound();

  const page = parseInt(searchParams.page ?? "1", 10);
  const limit = 20;
  const statusFilter = searchParams.status;

  const where = {
    businessId: business.id,
    ...(statusFilter ? { status: statusFilter as never } : {}),
  };

  const [posts, total] = await Promise.all([
    db.postDraft.findMany({
      where,
      orderBy: { publishAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { mediaAssets: true } },
      },
    }),
    db.postDraft.count({ where }),
  ]);

  const pages = Math.ceil(total / limit);

  const STATUS_OPTIONS = [
    "DRAFT", "VALIDATED", "READY", "SCHEDULED",
    "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED",
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "Inicio", href: "/dashboard" },
        { label: business.name, href: `/businesses/${params.slug}` },
        { label: "Posts" },
      ]} />

      <div className="animate-stagger-in delay-0">
        <h1 className="text-2xl font-black text-slate-100">
          {business.name} — Posts
        </h1>
        <p className="text-slate-500 mt-1">
          <span className="text-slate-300 font-bold">{total}</span> post{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 animate-stagger-in delay-1" role="group" aria-label="Filtrar por estado">
        <Link href={`/businesses/${params.slug}/posts`}>
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              !statusFilter
                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            }`}
            aria-pressed={!statusFilter}
          >
            Todos
          </button>
        </Link>
        {STATUS_OPTIONS.map((s) => (
          <Link key={s} href={`/businesses/${params.slug}/posts?status=${s}`}>
            <button
              type="button"
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                statusFilter === s
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
              }`}
              aria-pressed={statusFilter === s}
            >
              {s}
            </button>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="relative text-center py-20 rounded-2xl border border-dashed border-slate-700 bg-surface-card/50 animate-card-appear overflow-hidden bg-dots">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-primary/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 animate-float">
              <Search className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">No se encontraron posts</h3>
            <p className="text-slate-500 text-sm">Prueba cambiando los filtros</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/businesses/${params.slug}/posts/${post.id}`}
            >
              <div className={`group flex items-start justify-between gap-4 rounded-xl border border-slate-800/80 bg-surface-card px-5 py-4 card-hover animate-stagger-in delay-${Math.min(i + 2, 8)}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {POST_TYPE_ICON[post.postType]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                      {post.sourceFolderName}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {post.caption.slice(0, 120)}
                      {post.caption.length > 120 ? "..." : ""}
                    </p>
                    <p className="text-xs text-brand-400 mt-1 font-medium">
                      {formatDateInTz(post.publishAt, business.timezone)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded font-medium">
                    {post._count.mediaAssets} media
                  </span>
                  <StatusBadge status={post.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <nav aria-label="Paginacion" className="flex items-center gap-2 justify-center pt-4">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/businesses/${params.slug}/posts?page=${p}${
                statusFilter ? `&status=${statusFilter}` : ""
              }`}
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
