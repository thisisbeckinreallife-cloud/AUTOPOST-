import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import { subDays, startOfDay, startOfYear } from "date-fns";

export const dynamic = "force-dynamic";

type Range = "today" | "7d" | "30d" | "ytd";
const RANGE_DAYS: Record<Range, number> = { today: 1, "7d": 7, "30d": 30, ytd: 365 };

function rangeStart(range: Range, now: Date): Date {
  if (range === "today") return startOfDay(now);
  if (range === "7d") return startOfDay(subDays(now, 6));
  if (range === "30d") return startOfDay(subDays(now, 29));
  return startOfYear(now);
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const rangeRaw = sp.get("range") as Range | null;
    const range: Range = (["today", "7d", "30d", "ytd"] as const).includes((rangeRaw ?? "30d") as Range)
      ? ((rangeRaw ?? "30d") as Range)
      : "30d";

    const now = new Date();
    const start = rangeStart(range, now);

    const businesses = await db.business.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        metaConnection: { select: { igUsername: true, status: true } },
        postDrafts: {
          select: { status: true, postType: true, publishedAt: true, failedAt: true },
        },
      },
    });

    const rows = businesses.map((biz) => {
      const drafts = biz.postDrafts;
      const inRange = (d: Date | null) => d !== null && d >= start;
      const published = drafts.filter((p) => p.status === "PUBLISHED" && inRange(p.publishedAt)).length;
      const failed = drafts.filter((p) => p.status === "FAILED" && inRange(p.failedAt)).length;
      const total = published + failed;
      const reels = drafts.filter((p) => p.status === "PUBLISHED" && p.postType === "REEL" && inRange(p.publishedAt)).length;
      const carousels = drafts.filter((p) => p.status === "PUBLISHED" && p.postType === "CAROUSEL" && inRange(p.publishedAt)).length;
      const images = drafts.filter((p) => p.status === "PUBLISHED" && p.postType === "IMAGE" && inRange(p.publishedAt)).length;
      const lastPost = drafts
        .filter((p) => p.status === "PUBLISHED" && p.publishedAt)
        .sort((a, b) => (b.publishedAt!.getTime() - a.publishedAt!.getTime()))[0];
      const days = RANGE_DAYS[range];
      const avgPerDay = days > 0 ? Math.round((published / days) * 100) / 100 : 0;

      return {
        business_name: biz.name,
        business_slug: biz.slug,
        ig_username: biz.metaConnection?.igUsername ?? "",
        connection_status: biz.metaConnection?.status ?? "DISCONNECTED",
        published,
        failed,
        success_rate_pct: total > 0 ? Math.round((published / total) * 100) : null,
        avg_per_day: avgPerDay,
        reels,
        carousels,
        images,
        last_published_at: lastPost?.publishedAt ?? null,
      };
    });

    const csv = toCsv(rows, [
      "business_name",
      "business_slug",
      "ig_username",
      "connection_status",
      "published",
      "failed",
      "success_rate_pct",
      "avg_per_day",
      "reels",
      "carousels",
      "images",
      "last_published_at",
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(`aluminum-metrics-${range}-${stamp}.csv`, csv);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("[exports/metrics]", err);
    return new Response("Internal error", { status: 500 });
  }
}
