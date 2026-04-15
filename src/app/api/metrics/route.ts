import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { subDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();

    const now = new Date();
    const thirtyDaysAgo = startOfDay(subDays(now, 29));

    const [statusCounts, businesses, dailyPublished] = await Promise.all([
      // Global counts by status
      db.postDraft.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Per-business stats
      db.business.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          metaConnection: { select: { status: true, igUsername: true } },
          postDrafts: {
            select: { status: true },
          },
        },
      }),

      // Published posts per day in last 30 days
      db.postDraft.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: thirtyDaysAgo },
        },
        select: { publishedAt: true },
        orderBy: { publishedAt: "asc" },
      }),
    ]);

    // Build status map
    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row._count.id;
    }

    const totalPublished = statusMap["PUBLISHED"] ?? 0;
    const totalFailed = statusMap["FAILED"] ?? 0;
    const totalScheduled = statusMap["SCHEDULED"] ?? 0;
    const totalDraft = (statusMap["DRAFT"] ?? 0) + (statusMap["VALIDATED"] ?? 0) + (statusMap["READY"] ?? 0);
    const totalAll = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const successRate = totalAll > 0
      ? Math.round(((totalPublished) / Math.max(totalPublished + totalFailed, 1)) * 100)
      : 0;

    // Build per-business summary
    const businessStats = businesses.map((biz) => {
      const published = biz.postDrafts.filter((p) => p.status === "PUBLISHED").length;
      const failed = biz.postDrafts.filter((p) => p.status === "FAILED").length;
      const scheduled = biz.postDrafts.filter((p) => p.status === "SCHEDULED").length;
      return {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        igUsername: biz.metaConnection?.igUsername ?? null,
        connectionStatus: biz.metaConnection?.status ?? null,
        published,
        failed,
        scheduled,
        total: biz.postDrafts.length,
      };
    });

    // Build daily trend (last 30 days)
    const dayMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = subDays(now, 29 - i);
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = 0;
    }
    for (const post of dailyPublished) {
      if (post.publishedAt) {
        const key = post.publishedAt.toISOString().slice(0, 10);
        if (key in dayMap) dayMap[key]++;
      }
    }
    const dailyTrend = Object.entries(dayMap).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      data: {
        kpi: {
          totalPublished,
          totalFailed,
          totalScheduled,
          totalDraft,
          successRate,
        },
        businessStats,
        dailyTrend,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[metrics]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
