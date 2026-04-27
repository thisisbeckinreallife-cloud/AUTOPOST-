/**
 * Minimal RFC 4180-ish CSV serializer. No external deps.
 * - Escapes values containing comma, double-quote, newline.
 * - Coerces null/undefined to empty.
 * - Dates become ISO 8601 (UTC).
 */
export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  if (rows.length === 0) return columns ? columns.join(",") + "\n" : "";
  const cols = columns ?? Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((k) => set.add(k));
    return set;
  }, new Set<string>()));

  const header = cols.map(escapeCell).join(",");
  const body = rows.map((row) => cols.map((c) => escapeCell(formatValue(row[c]))).join(",")).join("\n");
  return header + "\n" + body + "\n";
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function escapeCell(s: string): string {
  if (s == null) return "";
  if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
