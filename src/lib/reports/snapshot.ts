/**
 * Computa el snapshot de un informe editorial para un negocio en un periodo.
 *
 * El snapshot se persiste tal cual en Report.* (totalScheduled, daily, etc.)
 * para que el informe sea estable: si tras generar el informe los posts
 * cambian de estado, el HTML servido sigue mostrando los números del momento
 * de generación.
 *
 * Llamado desde POST /api/businesses/[slug]/reports y desde scripts de test.
 */
import { db } from "@/lib/db";

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  published: number;
  scheduled: number;
  failed: number;
}

export interface ByType {
  IMAGE: number;
  CAROUSEL: number;
  REEL: number;
}

export interface TopPost {
  id: string;
  caption: string; // truncated to 240 chars
  postType: string;
  publishedAt: string; // ISO
  permalink: string | null;
  thumbUrl: string | null;
}

export interface ReportSnapshot {
  periodStart: Date;
  periodEnd: Date;
  totalScheduled: number;
  totalPublished: number;
  totalFailed: number;
  successRate: number;
  daily: DailyEntry[];
  byType: ByType;
  topPosts: TopPost[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function computeReportSnapshot(
  businessId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<ReportSnapshot> {
  const drafts = await db.postDraft.findMany({
    where: {
      businessId,
      OR: [
        { publishedAt: { gte: periodStart, lte: periodEnd } },
        {
          publishedAt: null,
          publishAt: { gte: periodStart, lte: periodEnd },
        },
      ],
    },
    select: {
      id: true,
      caption: true,
      postType: true,
      status: true,
      publishAt: true,
      publishedAt: true,
      failedAt: true,
      metaPermalink: true,
      mediaAssets: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { storageUrl: true, mimeType: true },
      },
    },
    orderBy: { publishAt: "asc" },
    take: 5000,
  });

  let totalScheduled = 0;
  let totalPublished = 0;
  let totalFailed = 0;
  const byType: ByType = { IMAGE: 0, CAROUSEL: 0, REEL: 0 };

  // Bucketize por día (zona UTC para estabilidad — el cliente luego renderiza
  // en la timezone del negocio si lo necesita).
  const days = new Map<string, DailyEntry>();
  for (
    let t = periodStart.getTime();
    t <= periodEnd.getTime();
    t += DAY_MS
  ) {
    const key = ymd(new Date(t));
    days.set(key, { date: key, published: 0, scheduled: 0, failed: 0 });
  }

  for (const d of drafts) {
    if (d.status === "PUBLISHED") {
      totalPublished++;
      const k = ymd(d.publishedAt ?? d.publishAt);
      const e = days.get(k);
      if (e) e.published++;
    } else if (d.status === "FAILED") {
      totalFailed++;
      const k = ymd(d.failedAt ?? d.publishAt);
      const e = days.get(k);
      if (e) e.failed++;
    } else {
      totalScheduled++;
      const k = ymd(d.publishAt);
      const e = days.get(k);
      if (e) e.scheduled++;
    }

    if (d.postType === "IMAGE") byType.IMAGE++;
    else if (d.postType === "CAROUSEL") byType.CAROUSEL++;
    else if (d.postType === "REEL") byType.REEL++;
  }

  const totalCompleted = totalPublished + totalFailed;
  const successRate =
    totalCompleted > 0
      ? Math.round((totalPublished / totalCompleted) * 1000) / 10
      : 0;

  // Top posts: los publicados más recientes, max 12.
  const topPosts: TopPost[] = drafts
    .filter((d) => d.status === "PUBLISHED")
    .slice(-12)
    .reverse()
    .map((d) => ({
      id: d.id,
      caption: d.caption.slice(0, 240),
      postType: d.postType,
      publishedAt: (d.publishedAt ?? d.publishAt).toISOString(),
      permalink: d.metaPermalink,
      thumbUrl: d.mediaAssets[0]?.storageUrl ?? null,
    }));

  return {
    periodStart,
    periodEnd,
    totalScheduled,
    totalPublished,
    totalFailed,
    successRate,
    daily: Array.from(days.values()),
    byType,
    topPosts,
  };
}
