"use client";

/**
 * Panel de informes editoriales en el detalle del negocio.
 * - Selector de periodo (último mes / últimos 30 días / último trimestre / personalizado)
 * - Botón "Generar informe" → POST /api/businesses/[slug]/reports
 * - Lista de informes generados con su URL pública compartible
 * - Botón "Copiar link" + "Abrir en nueva pestaña" + view count
 */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

interface ReportEntry {
  id: string;
  token: string;
  periodStart: string;
  periodEnd: string;
  expiresAt: string;
  totalPublished: number;
  successRate: number;
  viewCount: number;
  createdAt: string;
}

type Preset = "last30" | "currentMonth" | "lastMonth" | "lastQuarter" | "custom";

interface Props {
  businessSlug: string;
  appUrl: string;
}

export function ReportsPanel({ businessSlug, appUrl }: Props) {
  const { toast } = useToast();
  const [preset, setPreset] = useState<Preset>("last30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/businesses/${businessSlug}/reports`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.data)) setReports(data.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  function computePeriod(): { start: Date; end: Date } | null {
    const now = new Date();
    if (preset === "last30") {
      const end = now;
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end };
    }
    if (preset === "currentMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: now };
    }
    if (preset === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end };
    }
    if (preset === "lastQuarter") {
      const end = now;
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start, end };
    }
    // custom
    if (!customStart || !customEnd) return null;
    return { start: new Date(customStart), end: new Date(customEnd) };
  }

  async function generate() {
    const period = computePeriod();
    if (!period) {
      toast("Selecciona fechas válidas", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: period.start.toISOString(),
          periodEnd: period.end.toISOString(),
          expiresDays: 30,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "No se pudo generar", "error");
        return;
      }
      toast(`Informe generado · ${data.summary.totalPublished} posts`, "success");
      // Reload list
      const fresh = await fetch(`/api/businesses/${businessSlug}/reports`);
      if (fresh.ok) {
        const d = await fresh.json();
        if (Array.isArray(d.data)) setReports(d.data);
      }
    } catch {
      toast("Error de red", "error");
    } finally {
      setGenerating(false);
    }
  }

  function copyLink(token: string) {
    const url = `${appUrl.replace(/\/$/, "")}/informe/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast("Enlace copiado al portapapeles", "success"),
      () => toast("No se pudo copiar", "error"),
    );
  }

  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "clamp(20px, 3vw, 32px)",
      }}
    >
      <header style={{ marginBottom: 18 }}>
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color: "var(--ap-stamp)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          ✦ Informe editorial
        </p>
        <h3
          className="ap-display"
          style={{
            fontSize: "clamp(22px, 3vw, 28px)",
            fontStyle: "normal",
            lineHeight: 1,
            color: "var(--ap-ink)",
            margin: "6px 0 0",
            letterSpacing: "-0.01em",
          }}
        >
          Generar informe del periodo
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--ap-ink-3)",
            margin: "8px 0 0",
            fontStyle: "normal",
          }}
        >
          Resumen imprimible (Cmd+P → Save as PDF) listo para compartir con el cliente.
        </p>
      </header>

      <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
        <label
          className="ap-mono"
          htmlFor="period-preset"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Periodo
        </label>
        <select
          id="period-preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value as Preset)}
          disabled={generating}
          style={selectStyle}
        >
          <option value="last30">Últimos 30 días</option>
          <option value="currentMonth">Mes en curso</option>
          <option value="lastMonth">Mes pasado</option>
          <option value="lastQuarter">Último trimestre</option>
          <option value="custom">Periodo personalizado</option>
        </select>

        {preset === "custom" && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={{ flex: 1, minWidth: 180 }}>
              <span
                className="ap-mono"
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Desde
              </span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                disabled={generating}
                style={selectStyle}
              />
            </label>
            <label style={{ flex: 1, minWidth: 180 }}>
              <span
                className="ap-mono"
                style={{
                  display: "block",
                  fontSize: 10,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Hasta
              </span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                disabled={generating}
                style={selectStyle}
              />
            </label>
          </div>
        )}

        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="ap-btn ap-btn--stamp"
          style={{
            padding: "12px 20px",
            fontSize: 13,
            opacity: generating ? 0.5 : 1,
            justifySelf: "start",
          }}
        >
          {generating ? "Generando…" : "Generar informe"}
        </button>
      </div>

      {!loading && reports.length > 0 && (
        <div>
          <hr className="ap-rule" style={{ margin: "18px 0", opacity: 0.5 }} />
          <p
            className="ap-mono"
            style={{
              fontSize: 11,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            Generados · {reports.length}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {reports.slice(0, 5).map((r) => {
              const expired = new Date(r.expiresAt) < new Date();
              const period = `${new Date(r.periodStart).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – ${new Date(r.periodEnd).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;
              return (
                <li
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: "1px solid var(--ap-line)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: "var(--ap-ink-2)",
                        fontStyle: "normal",
                      }}
                    >
                      {period}
                    </p>
                    <p
                      className="ap-mono"
                      style={{
                        margin: "2px 0 0",
                        fontSize: 10,
                        color: "var(--ap-ink-4)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {r.totalPublished} pub · {r.successRate}% éxito · {r.viewCount} vistas
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => copyLink(r.token)}
                      disabled={expired}
                      className="ap-mono"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--ap-line-2)",
                        padding: "6px 12px",
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: expired ? "var(--ap-ink-4)" : "var(--ap-ink-2)",
                        cursor: expired ? "not-allowed" : "pointer",
                        opacity: expired ? 0.4 : 1,
                      }}
                    >
                      Copiar enlace
                    </button>
                    <a
                      href={`/informe/${r.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ap-mono"
                      style={{
                        background: "var(--ap-stamp)",
                        color: "var(--ap-paper)",
                        padding: "6px 12px",
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        opacity: expired ? 0.5 : 1,
                        pointerEvents: expired ? "none" : "auto",
                      }}
                    >
                      Abrir →
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "var(--ap-paper)",
  border: "1px solid var(--ap-line-2)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  color: "var(--ap-ink)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
