import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_PREFIXES: Record<string, string[]> = {
  content: ["POST_", "BATCH_"],
  meta: ["META_"],
  system: ["BUSINESS_", "SEED_", "ADMIN_"],
};

function rangeStart(range: string | null): Date | null {
  const now = new Date();
  if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const sp = request.nextUrl.searchParams;
    const action = sp.get("action");
    const category = sp.get("category");
    const range = sp.get("range");
    const q = (sp.get("q") ?? "").trim();

    const andClauses: Prisma.AuditLogWhereInput[] = [];
    if (action) andClauses.push({ action });
    if (category && CATEGORY_PREFIXES[category]) {
      andClauses.push({ OR: CATEGORY_PREFIXES[category].map((p) => ({ action: { startsWith: p } })) });
    }
    const start = rangeStart(range);
    if (start) andClauses.push({ createdAt: { gte: start } });
    if (q) {
      andClauses.push({
        OR: [
          { entityId: { contains: q, mode: "insensitive" } },
          { action: { contains: q.toUpperCase() } },
        ],
      });
    }
    const where = andClauses.length > 0 ? { AND: andClauses } : {};

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 5000, // hard cap
      include: { business: { select: { name: true, slug: true } } },
    });

    const rows = logs.map((l) => ({
      timestamp: l.createdAt,
      action: l.action,
      business_name: l.business?.name ?? "",
      business_slug: l.business?.slug ?? "",
      entity_type: l.entityType ?? "",
      entity_id: l.entityId ?? "",
      detail: l.detail ?? null,
    }));

    const csv = toCsv(rows, [
      "timestamp",
      "action",
      "business_name",
      "business_slug",
      "entity_type",
      "entity_id",
      "detail",
    ]);

    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(`aluminum-logs-${stamp}.csv`, csv);
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("[exports/logs]", err);
    return new Response("Internal error", { status: 500 });
  }
}
