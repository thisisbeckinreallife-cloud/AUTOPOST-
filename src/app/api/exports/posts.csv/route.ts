import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import type { Prisma, PostDraftStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_STATUSES: readonly PostDraftStatus[] = [
  "DRAFT", "VALIDATED", "READY", "SCHEDULED",
  "PUBLISHING", "PUBLISHED", "FAILED", "CANCELLED",
] as const;

function parseStatus(s: string | null): PostDraftStatus | null {
  if (!s) return null;
  return (VALID_STATUSES as readonly string[]).includes(s) ? (s as PostDraftStatus) : null;
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const slug = sp.get("slug");
    const status = parseStatus(sp.get("status"));

    const where: Prisma.PostDraftWhereInput = {};
    if (slug) {
      const biz = await db.business.findUnique({ where: { slug }, select: { id: true } });
      if (!biz) return new Response("Business not found", { status: 404 });
      where.businessId = biz.id;
    }
    if (status) where.status = status;

    const posts = await db.postDraft.findMany({
      where,
      orderBy: { publishAt: "asc" },
      take: 5000,
      include: {
        business: { select: { name: true, slug: true } },
        _count: { select: { mediaAssets: true } },
      },
    });

    const rows = posts.map((p) => ({
      id: p.id,
      business: p.business.name,
      business_slug: p.business.slug,
      post_type: p.postType,
      status: p.status,
      caption: p.caption,
      publish_at: p.publishAt,
      published_at: p.publishedAt,
      failed_at: p.failedAt,
      attempts: p.attemptCount,
      media_count: p._count.mediaAssets,
      meta_publication_id: p.metaPublicationId ?? "",
      meta_permalink: p.metaPermalink ?? "",
      last_error: p.lastError ?? "",
    }));

    const csv = toCsv(rows, [
      "id",
      "business",
      "business_slug",
      "post_type",
      "status",
      "caption",
      "publish_at",
      "published_at",
      "failed_at",
      "attempts",
      "media_count",
      "meta_publication_id",
      "meta_permalink",
      "last_error",
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    const fname = slug ? `aluminum-posts-${slug}-${stamp}.csv` : `aluminum-posts-${stamp}.csv`;
    return csvResponse(fname, csv);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("[exports/posts]", err);
    return new Response("Internal error", { status: 500 });
  }
}
