"use client";

/**
 * FormatWarnings — muestra avisos editoriales de formato per-plataforma.
 *
 * Aparece en el post detail page cuando hay issues de compatibilidad.
 * Se autoresuelve consultando GET /api/posts/{id}/compatibility.
 *
 * Estados visuales por severity:
 *   - blocker: borde tomate sólido — bloquea publicación
 *   - warning: borde mostaza — publicará pero queda mal
 *   - tip: borde oliva — sugerencia de optimización
 */
import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Lightbulb, CheckCircle2 } from "lucide-react";

interface CompatibilityIssue {
  severity: "blocker" | "warning" | "tip";
  message: string;
  recommendation?: string;
}

interface CompatibilityReport {
  platform: string;
  recommended: boolean;
  blockerCount: number;
  warningCount: number;
  tipCount: number;
  issues: Array<
    CompatibilityIssue & {
      platform: string;
    }
  >;
}

interface Props {
  postId: string;
  /** Plataformas que el user ha marcado como destino — solo se muestran issues de éstas */
  targetPlatforms?: string[];
  publishToMeta?: boolean;
}

export function FormatWarnings({
  postId,
  targetPlatforms = [],
  publishToMeta = true,
}: Props) {
  const [reports, setReports] = useState<CompatibilityReport[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/posts/${postId}/compatibility`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setReports(data.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  if (loading || !reports) return null;

  // Filtrar a las plataformas que el user va a usar
  const relevantPlatforms = new Set(targetPlatforms);
  if (publishToMeta) {
    relevantPlatforms.add("INSTAGRAM");
    relevantPlatforms.add("FACEBOOK");
  }

  const relevantReports = reports.filter((r) =>
    relevantPlatforms.has(r.platform),
  );

  // Si no hay issues en las plataformas elegidas, ocultar componente
  const hasAnyIssue = relevantReports.some(
    (r) => r.blockerCount + r.warningCount + r.tipCount > 0,
  );
  if (!hasAnyIssue) {
    return <AllGoodCard count={relevantReports.length} />;
  }

  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "16px 18px",
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: "0 0 14px",
        }}
      >
        ⚠ Avisos de formato por plataforma
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {relevantReports.map((report) => (
          <PlatformReport key={report.platform} report={report} />
        ))}
      </div>
    </div>
  );
}

function AllGoodCard({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-olive)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <CheckCircle2
        strokeWidth={1.8}
        style={{ width: 16, height: 16, color: "var(--ap-olive)", flexShrink: 0 }}
      />
      <p
        className="ap-mono"
        style={{
          margin: 0,
          fontSize: 11,
          color: "var(--ap-olive)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Formato compatible con las {count} plataforma{count > 1 ? "s" : ""}{" "}
        elegida{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube Shorts",
  PINTEREST: "Pinterest",
};

function PlatformReport({ report }: { report: CompatibilityReport }) {
  const blockers = report.issues.filter((i) => i.severity === "blocker");
  const warnings = report.issues.filter((i) => i.severity === "warning");
  const tips = report.issues.filter((i) => i.severity === "tip");

  // Si no hay nada en esta plataforma, no la mostramos
  if (blockers.length === 0 && warnings.length === 0 && tips.length === 0) {
    return null;
  }

  const headerBorder = blockers.length
    ? "var(--ap-stamp)"
    : warnings.length
      ? "#D4A627"
      : "var(--ap-olive)";

  return (
    <div
      style={{
        borderLeft: `2px solid ${headerBorder}`,
        background: "var(--ap-paper)",
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "var(--ap-ink)",
            fontWeight: 600,
          }}
        >
          {PLATFORM_LABELS[report.platform] ?? report.platform}
        </p>
        <p
          className="ap-mono"
          style={{
            margin: 0,
            fontSize: 9,
            color: blockers.length
              ? "var(--ap-stamp)"
              : warnings.length
                ? "#D4A627"
                : "var(--ap-olive)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {blockers.length > 0
            ? `${blockers.length} bloqueante${blockers.length > 1 ? "s" : ""}`
            : warnings.length > 0
              ? `${warnings.length} aviso${warnings.length > 1 ? "s" : ""}`
              : `${tips.length} sugerencia${tips.length > 1 ? "s" : ""}`}
        </p>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {[...blockers, ...warnings, ...tips].map((issue, i) => (
          <IssueLine key={i} issue={issue} />
        ))}
      </ul>
    </div>
  );
}

function IssueLine({ issue }: { issue: CompatibilityIssue }) {
  const Icon =
    issue.severity === "blocker"
      ? AlertCircle
      : issue.severity === "warning"
        ? AlertTriangle
        : Lightbulb;
  const color =
    issue.severity === "blocker"
      ? "var(--ap-stamp)"
      : issue.severity === "warning"
        ? "#D4A627"
        : "var(--ap-olive)";

  return (
    <li
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "6px 0",
        fontSize: 13,
        color: "var(--ap-ink-2)",
        lineHeight: 1.5,
      }}
    >
      <Icon
        strokeWidth={1.8}
        style={{
          width: 14,
          height: 14,
          color,
          flexShrink: 0,
          marginTop: 3,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span>{issue.message}</span>
        {issue.recommendation && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "var(--ap-ink-3)",
              fontStyle: "normal",
            }}
          >
            → {issue.recommendation}
          </p>
        )}
      </div>
    </li>
  );
}
