/**
 * POST /api/businesses/[slug]/reports
 *
 * Genera un informe editorial para un negocio en un periodo. Devuelve el
 * token y la URL pública /informe/[token]. El admin comparte ese enlace
 * con el cliente; el cliente lo abre y hace Cmd+P para guardar como PDF.
 *
 * Body:
 *   {
 *     periodStart: ISO datetime,
 *     periodEnd:   ISO datetime,
 *     expiresDays?: number,  // default 30, max 365
 *   }
 *
 * Auth: requireSession.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { computeReportSnapshot } from "@/lib/reports/snapshot";

const bodySchema = z.object({
  periodStart: z.string().datetime({ offset: true }),
  periodEnd: z.string().datetime({ offset: true }),
  expiresDays: z.number().int().min(1).max(365).default(30),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const periodStart = new Date(parsed.data.periodStart);
  const periodEnd = new Date(parsed.data.periodEnd);

  if (periodEnd <= periodStart) {
    return NextResponse.json(
      { error: "periodEnd debe ser posterior a periodStart" },
      { status: 400 },
    );
  }

  // Cap razonable: 365 días por informe (rendimiento + claridad visual).
  const maxRange = 365 * 24 * 60 * 60 * 1000;
  if (periodEnd.getTime() - periodStart.getTime() > maxRange) {
    return NextResponse.json(
      { error: "Periodo máximo: 365 días" },
      { status: 400 },
    );
  }

  const snapshot = await computeReportSnapshot(
    business.id,
    periodStart,
    periodEnd,
  );

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(
    Date.now() + parsed.data.expiresDays * 24 * 60 * 60 * 1000,
  );

  const report = await db.report.create({
    data: {
      businessId: business.id,
      token,
      periodStart: snapshot.periodStart,
      periodEnd: snapshot.periodEnd,
      expiresAt,
      totalScheduled: snapshot.totalScheduled,
      totalPublished: snapshot.totalPublished,
      totalFailed: snapshot.totalFailed,
      successRate: snapshot.successRate,
      daily: snapshot.daily as unknown as Prisma.InputJsonValue,
      byType: snapshot.byType as unknown as Prisma.InputJsonValue,
      topPosts: snapshot.topPosts as unknown as Prisma.InputJsonValue,
      createdByAdminUserId: session.adminUserId,
    },
    select: { id: true, token: true, expiresAt: true },
  });

  await db.auditLog.create({
    data: {
      businessId: business.id,
      adminUserId: session.adminUserId,
      action: "REPORT_GENERATED",
      entityType: "Business",
      entityId: business.id,
      detail: {
        reportId: report.id,
        periodStart: snapshot.periodStart.toISOString(),
        periodEnd: snapshot.periodEnd.toISOString(),
        published: snapshot.totalPublished,
        successRate: snapshot.successRate,
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://autopost.app";
  const reportUrl = `${baseUrl.replace(/\/$/, "")}/informe/${report.token}`;

  return NextResponse.json({
    id: report.id,
    token: report.token,
    url: reportUrl,
    expiresAt: report.expiresAt,
    summary: {
      totalScheduled: snapshot.totalScheduled,
      totalPublished: snapshot.totalPublished,
      totalFailed: snapshot.totalFailed,
      successRate: snapshot.successRate,
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const reports = await db.report.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      token: true,
      periodStart: true,
      periodEnd: true,
      expiresAt: true,
      totalPublished: true,
      successRate: true,
      viewCount: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: reports });
}
