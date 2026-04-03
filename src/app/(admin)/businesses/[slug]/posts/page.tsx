import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateInTz } from "@/lib/utils";
import { Image, Film, Layers } from "lucide-react";

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
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          {business.name} — Posts
        </h1>
        <p className="text-slate-500 mt-1">
          {total} post{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <Link href={`/businesses/${params.slug}/posts`}>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              !statusFilter
                ? "bg-brand-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            All
          </span>
        </Link>
        {STATUS_OPTIONS.map((s) => (
          <Link key={s} href={`/businesses/${params.slug}/posts?status=${s}`}>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                statusFilter === s
                  ? "bg-brand-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {s}
            </span>
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No se encontraron posts.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/businesses/${params.slug}/posts/${post.id}`}
            >
              <Card className="hover:border-slate-700 transition-all cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        {POST_TYPE_ICON[post.postType]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {post.sourceFolderName}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {post.caption.slice(0, 120)}
                          {post.caption.length > 120 ? "..." : ""}
                        </p>
                        <p className="text-xs text-brand-400 mt-1">
                          {formatDateInTz(post.publishAt, business.timezone)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">
                        {post._count.mediaAssets} media
                      </span>
                      <StatusBadge status={post.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/businesses/${params.slug}/posts?page=${p}${
                statusFilter ? `&status=${statusFilter}` : ""
              }`}
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
