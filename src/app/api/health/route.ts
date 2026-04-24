/**
 * GET /api/health
 * Returns the status of all required configuration WITHOUT exposing values.
 * Used by the Settings page to show exactly what is missing.
 */
import { NextResponse } from "next/server";
import { getHealthReport } from "@/lib/health";

export async function GET() {
  const report = await getHealthReport();
  return NextResponse.json(report, { status: report.ok ? 200 : 500 });
}
