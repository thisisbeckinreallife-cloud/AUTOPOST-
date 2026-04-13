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

      <div>
        <h1 className="font-display text-xl font-bold text-white">
          {business.name} — Posts
        </h1>
        <p className="text-zinc-500 mt-1">
          <span className="text-zinc-300 font-semibold">{total}</span> post{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        <Link href={`/businesses/${params.slug}/posts`}>
          <button
            type="button"
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              !statusFilter
                ? "bg-brand-500 text-white"
                : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
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
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s
                  ? "bg-brand-500 text-white"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
              }`}
              aria-pressed={statusFilter === s}
            >
              {s}
            </button>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.08] bg-surface-card">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-zinc-500" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">No se encontraron posts</h3>
          <p className="text-zinc-500 text-sm">Prueba cambiando los filtros</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/businesses/${params.slug}/posts/${post.id}`}
            >
              <div className="group flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-surface-card px-4 py-3.5 hover:border-white/[0.08] transition-all">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                    {POST_TYPE_ICON[post.postType]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                      {post.sourceFolderName}
                    </p>
                    <p className="text-xs text-zinc-600 truncate mt-0.5">
                      {post.caption.slice(0, 120)}
                      {post.caption.length > 120 ? "..." : ""}
                    </p>
                    <p className="text-xs text-brand-400 mt-1 font-medium">
                      {formatDateInTz(post.publishAt, business.timezone)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded font-medium">
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
