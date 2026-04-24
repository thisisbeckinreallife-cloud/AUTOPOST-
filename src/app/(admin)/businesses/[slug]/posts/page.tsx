import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { Image as ImageIcon, Film, Layers, Search, Clock } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

const POST_TYPE_ICON: Record<string, React.ReactNode> = {
  IMAGE: <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />,
  CAROUSEL: <Layers className="h-3.5 w-3.5 text-blue-700" />,
  REEL: <Film className="h-3.5 w-3.5 text-purple-700" />,
};

const POST_TYPE_BG: Record<string, string> = {
  IMAGE: "bg-emerald-100",
  CAROUSEL: "bg-blue-100",
  REEL: "bg-purple-100",
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
        mediaAssets: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { storageUrl: true, mimeType: true },
        },
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

      <div className="animate-fade-up">
        <h1 className="font-display text-xl font-bold text-zinc-900">
          {business.name} — Posts
        </h1>
        <p className="text-zinc-600 mt-1 text-sm">
          <span className="text-zinc-900 font-semibold">{total}</span> post{total !== 1 ? "s" : ""}
          {statusFilter && <> · filtrado por {statusFilter}</>}
        </p>
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

      {posts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-zinc-400" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 mb-1">No se encontraron posts</h3>
          <p className="text-zinc-600 text-sm">Prueba cambiando los filtros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const firstMedia = post.mediaAssets[0];
            const mediaCount = post._count.mediaAssets;
            return (
              <Link
                key={post.id}
                href={`/businesses/${params.slug}/posts/${post.id}`}
                className="group block rounded-xl border border-zinc-200 bg-white px-3.5 py-3 hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3.5">
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100">
                    {firstMedia?.mimeType.startsWith("image/") && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstMedia.storageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {firstMedia?.mimeType.startsWith("video/") && (
                      <>
                        <video
                          src={firstMedia.storageUrl}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                            <Film className="h-2.5 w-2.5 text-white" />
                          </div>
                        </div>
                      </>
                    )}
                    {!firstMedia && (
                      <div className={`absolute inset-0 flex items-center justify-center ${POST_TYPE_BG[post.postType] ?? "bg-zinc-100"}`}>
                        {POST_TYPE_ICON[post.postType]}
                      </div>
                    )}
                    {mediaCount > 1 && (
                      <div className="absolute top-0.5 right-0.5 px-1 rounded bg-black/60 text-white text-[9px] font-bold font-mono">
                        +{mediaCount - 1}
                      </div>
                    )}
                  </div>

                  {/* Main */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold font-mono ${POST_TYPE_BG[post.postType] ?? "bg-zinc-100"} text-zinc-700`}>
                        {POST_TYPE_ICON[post.postType]}
                        {post.postType}
                      </span>
                      <p className="text-xs text-zinc-500 truncate font-mono">
                        {post.sourceFolderName}
                      </p>
                    </div>
                    <p className="text-sm text-zinc-900 truncate leading-snug">
                      {post.caption.slice(0, 90)}
                      {post.caption.length > 90 ? "…" : ""}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 tabular-nums flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateInTz(post.publishAt, business.timezone)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    <StatusBadge status={post.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1 justify-center pt-4">
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
