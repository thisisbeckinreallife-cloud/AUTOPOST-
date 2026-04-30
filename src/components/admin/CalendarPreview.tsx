"use client";

/**
 * CalendarPreview — calendario visual interactivo que se renderiza inline
 * en el chat IA cuando el LLM llama a suggest_schedule.
 *
 * Cada item es una card con:
 *   - Miniatura del media
 *   - Iconos de plataformas destino
 *   - Fecha + hora con relativos
 *   - Preview del caption (si lo hay)
 *   - Badges de recomendaciones por plataforma (✓ óptimo / ⚠ aviso / 💡 tip)
 *
 * Click en card → modal lightbox con InstagramMockup (vista previa real)
 *   que también permite editar caption + plataformas + fecha.
 *
 * Botón global "Aprobar todo y programar" → llama a confirm_batch_schedule
 * vía streamChat con un mensaje sintético.
 */
import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Lightbulb, Calendar, X, Loader2 } from "lucide-react";
import { InstagramMockup } from "./InstagramMockup";
import type { SocialPlatform } from "@prisma/client";

export interface SchedulePost {
  postDraftId: string;
  sourceFolderName: string;
  proposedAt: string; // ISO
  platforms: string[]; // ["instagram", "tiktok", ...]
  // Datos enriquecidos que el componente trae aparte
  thumbnailUrl?: string;
  postType?: string; // IMAGE | CAROUSEL | REEL
  mediaCount?: number;
  caption?: string;
  // Compatibilidad por plataforma — se carga desde /api/posts/{id}/compatibility
  compatibility?: Array<{
    platform: string;
    recommended: boolean;
    issues: Array<{
      severity: "blocker" | "warning" | "tip";
      message: string;
      recommendation?: string;
    }>;
  }>;
}

export interface CalendarPreviewProps {
  /** Schedule completo propuesto por suggest_schedule */
  schedule: SchedulePost[];
  timezone: string;
  /** ID del batch — para el botón aprobar */
  batchId: string;
  /** Callback cuando el user aprueba — el chat dispara confirm_batch_schedule */
  onApprove: () => void;
  /** Callback cuando el user pide cambios — abre el textarea del chat */
  onRequestChanges?: () => void;
  /** Si el chat está ocupado, deshabilita el botón aprobar */
  disabled?: boolean;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  pinterest: "Pinterest",
};

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📷",
  facebook: "👥",
  tiktok: "🎵",
  linkedin: "in",
  youtube: "▶",
  pinterest: "📌",
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  pinterest: "#E60023",
};

export function CalendarPreview({
  schedule,
  timezone,
  batchId: _batchId,
  onApprove,
  onRequestChanges,
  disabled,
}: CalendarPreviewProps) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<SchedulePost[]>(schedule);
  const [loading, setLoading] = useState(true);

  // Enriquecer cada post con thumbnail + caption + compatibility
  useEffect(() => {
    let cancelled = false;
    async function enrich() {
      const enriched = await Promise.all(
        schedule.map(async (s) => {
          try {
            const [postRes, compatRes] = await Promise.all([
              fetch(`/api/posts/${s.postDraftId}`),
              fetch(`/api/posts/${s.postDraftId}/compatibility`),
            ]);
            const postData = postRes.ok ? await postRes.json() : null;
            const compatData = compatRes.ok ? await compatRes.json() : null;

            const post = postData?.data;
            const firstAsset = post?.mediaAssets?.[0];
            return {
              ...s,
              thumbnailUrl: firstAsset?.storageUrl,
              postType: post?.postType,
              mediaCount: post?.mediaAssets?.length ?? 0,
              caption: post?.caption,
              compatibility: compatData?.data ?? [],
            };
          } catch {
            return s;
          }
        }),
      );
      if (!cancelled) {
        setPosts(enriched);
        setLoading(false);
      }
    }
    enrich();
    return () => {
      cancelled = true;
    };
  }, [schedule]);

  const openPost = posts.find((p) => p.postDraftId === openPostId) ?? null;

  return (
    <div
      style={{
        marginTop: 12,
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Calendar
          strokeWidth={1.8}
          style={{ width: 16, height: 16, color: "var(--ap-stamp)" }}
        />
        <p
          className="ap-mono"
          style={{
            margin: 0,
            fontSize: 11,
            color: "var(--ap-stamp)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Calendario propuesto · {posts.length} posts
        </p>
        <span
          className="ap-mono"
          style={{
            marginLeft: "auto",
            fontSize: 9,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {timezone}
        </span>
      </div>

      {loading && posts.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "20px 0",
            color: "var(--ap-ink-3)",
            fontSize: 13,
          }}
        >
          <Loader2 className="animate-spin" style={{ width: 14, height: 14 }} />
          Cargando previews...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((post) => (
            <PostCard
              key={post.postDraftId}
              post={post}
              onClick={() => setOpenPostId(post.postDraftId)}
            />
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid var(--ap-line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: "var(--ap-ink-3)",
            fontStyle: "italic",
            flex: 1,
            minWidth: 0,
          }}
        >
          O dime qué cambiar (ej: <em>&quot;mueve el martes al jueves&quot;</em>,{" "}
          <em>&quot;quita TikTok del 3º&quot;</em>).
        </p>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {onRequestChanges && (
            <button
              type="button"
              onClick={onRequestChanges}
              disabled={disabled}
              className="ap-btn ap-btn--ghost"
              style={{
                padding: "10px 14px",
                fontSize: 12,
                fontFamily: "var(--ap-font-mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: disabled ? 0.5 : 1,
              }}
            >
              Pedir cambios
            </button>
          )}
          <button
            type="button"
            onClick={onApprove}
            disabled={disabled}
            className="ap-btn ap-btn--stamp"
            style={{
              padding: "10px 18px",
              fontSize: 12,
              fontFamily: "var(--ap-font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            ✓ Aprobar todo y programar
          </button>
        </div>
      </div>

      {openPost && (
        <PostPreviewModal post={openPost} onClose={() => setOpenPostId(null)} />
      )}
    </div>
  );
}

function PostCard({ post, onClick }: { post: SchedulePost; onClick: () => void }) {
  const date = new Date(post.proposedAt);
  const dateLabel = formatRelative(date);

  // Resumen de issues por plataforma
  const issuesByPlatform = (post.compatibility ?? []).filter((r) =>
    post.platforms.some((p) => p.toUpperCase() === r.platform),
  );

  const blockerCount = issuesByPlatform.reduce(
    (n, r) => n + r.issues.filter((i) => i.severity === "blocker").length,
    0,
  );
  const warningCount = issuesByPlatform.reduce(
    (n, r) => n + r.issues.filter((i) => i.severity === "warning").length,
    0,
  );
  const tipCount = issuesByPlatform.reduce(
    (n, r) => n + r.issues.filter((i) => i.severity === "tip").length,
    0,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        gap: 14,
        padding: "12px 14px",
        background: "var(--ap-paper)",
        border: "1px solid var(--ap-line-2)",
        transition: "border-color 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--ap-ink)";
        (e.currentTarget as HTMLElement).style.transform = "translate(-1px, -1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--ap-line-2)";
        (e.currentTarget as HTMLElement).style.transform = "translate(0, 0)";
      }}
      aria-label={`Ver vista previa de ${post.sourceFolderName}`}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 64,
          height: 64,
          flexShrink: 0,
          background: post.thumbnailUrl
            ? `url(${post.thumbnailUrl}) center/cover`
            : "var(--ap-paper-2)",
          border: "1px solid var(--ap-line-2)",
          position: "relative",
        }}
      >
        {!post.thumbnailUrl && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: "var(--ap-ink-4)",
            }}
          >
            {post.postType === "REEL" ? "🎬" : post.postType === "CAROUSEL" ? "📚" : "📷"}
          </span>
        )}
        {post.postType === "CAROUSEL" && (post.mediaCount ?? 0) > 1 && (
          <span
            className="ap-mono"
            style={{
              position: "absolute",
              bottom: 2,
              right: 2,
              background: "rgba(20,17,13,0.85)",
              color: "var(--ap-paper)",
              fontSize: 9,
              padding: "1px 5px",
              letterSpacing: "0.04em",
            }}
          >
            ×{post.mediaCount}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ap-ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {post.sourceFolderName}
        </p>

        {/* Plataformas */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {post.platforms.map((p) => (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 7px",
                background: "var(--ap-paper-2)",
                border: `1px solid ${PLATFORM_COLORS[p.toLowerCase()] ?? "var(--ap-line-2)"}`,
                fontSize: 10,
                color: "var(--ap-ink-2)",
                fontFamily: "var(--ap-font-mono)",
                letterSpacing: "0.04em",
              }}
            >
              <span aria-hidden="true">{PLATFORM_ICONS[p.toLowerCase()] ?? "·"}</span>
              {PLATFORM_LABELS[p.toLowerCase()] ?? p}
            </span>
          ))}
          <span
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-3)",
              letterSpacing: "0.06em",
              marginLeft: 4,
            }}
          >
            · {dateLabel}
          </span>
        </div>

        {/* Caption preview */}
        {post.caption && post.caption.trim().length > 0 && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--ap-ink-3)",
              fontStyle: "italic",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            &ldquo;{post.caption.slice(0, 80)}
            {post.caption.length > 80 ? "..." : ""}&rdquo;
          </p>
        )}

        {/* Recomendaciones — badges resumidas */}
        {(blockerCount > 0 || warningCount > 0 || tipCount > 0) ? (
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            {blockerCount > 0 && (
              <span
                className="ap-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 9,
                  color: "var(--ap-stamp)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <AlertTriangle strokeWidth={2} style={{ width: 10, height: 10 }} />
                {blockerCount} {blockerCount === 1 ? "bloqueante" : "bloqueantes"}
              </span>
            )}
            {warningCount > 0 && (
              <span
                className="ap-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 9,
                  color: "#D4A627",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <AlertTriangle strokeWidth={2} style={{ width: 10, height: 10 }} />
                {warningCount} {warningCount === 1 ? "aviso" : "avisos"}
              </span>
            )}
            {tipCount > 0 && (
              <span
                className="ap-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontSize: 9,
                  color: "#6B7A2E",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <Lightbulb strokeWidth={2} style={{ width: 10, height: 10 }} />
                {tipCount} {tipCount === 1 ? "tip" : "tips"}
              </span>
            )}
          </div>
        ) : (
          <span
            className="ap-mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 9,
              color: "#6B7A2E",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            <CheckCircle2 strokeWidth={2} style={{ width: 10, height: 10 }} />
            Todo en orden
          </span>
        )}
      </div>

      {/* Hint click */}
      <span
        className="ap-mono"
        style={{
          alignSelf: "center",
          fontSize: 9,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        Ver →
      </span>
    </button>
  );
}

function PostPreviewModal({
  post,
  onClose,
}: {
  post: SchedulePost;
  onClose: () => void;
}) {
  const [postData, setPostData] = useState<{
    caption: string;
    postType: string;
    mediaAssets: Array<{
      id: string;
      storageUrl: string;
      mimeType: string;
      sortOrder: number;
    }>;
    business: { name: string };
    metaUsername?: string | null;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/posts/${post.postDraftId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.data) return;
        setPostData({
          caption: data.data.caption,
          postType: data.data.postType,
          mediaAssets: data.data.mediaAssets ?? [],
          business: data.data.business ?? { name: "marca" },
          metaUsername: data.meta?.username ?? null,
        });
      })
      .catch(() => {});
  }, [post.postDraftId]);

  // ESC para cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Issues completas para mostrar en el modal
  const allIssues = (post.compatibility ?? [])
    .filter((r) => post.platforms.some((p) => p.toUpperCase() === r.platform))
    .flatMap((r) =>
      r.issues.map((i) => ({
        ...i,
        platform: r.platform,
      })),
    );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,17,13,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del post"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(241,236,226,0.95)",
          border: "1px solid var(--ap-line-2)",
          padding: 10,
          cursor: "pointer",
          color: "var(--ap-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X strokeWidth={1.8} style={{ width: 18, height: 18 }} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "92vh",
          overflowY: "auto",
          background: "var(--ap-paper)",
          padding: "24px",
          maxWidth: 540,
          width: "100%",
        }}
      >
        <p
          className="ap-mono"
          style={{
            margin: "0 0 6px",
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Vista previa · {formatRelative(new Date(post.proposedAt))}
        </p>
        <h3
          className="ap-display"
          style={{
            margin: "0 0 18px",
            fontSize: 22,
            fontStyle: "italic",
            color: "var(--ap-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {post.sourceFolderName}
        </h3>

        {postData ? (
          <InstagramMockup
            username={postData.metaUsername ?? postData.business.name.toLowerCase().replace(/\s+/g, "")}
            caption={postData.caption}
            postType={postData.postType}
            mediaAssets={postData.mediaAssets.map((m) => ({
              id: m.id,
              storageUrl: m.storageUrl,
              mimeType: m.mimeType,
              sortOrder: m.sortOrder,
            }))}
            publishAt={post.proposedAt}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 0",
              color: "var(--ap-ink-3)",
            }}
          >
            <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} />
          </div>
        )}

        {/* Plataformas + recomendaciones */}
        <div style={{ marginTop: 18 }}>
          <p
            className="ap-mono"
            style={{
              margin: "0 0 10px",
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Se publicará en
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {post.platforms.map((p) => (
              <span
                key={p}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  background: "var(--ap-paper-2)",
                  border: `1.5px solid ${PLATFORM_COLORS[p.toLowerCase()] ?? "var(--ap-line-2)"}`,
                  fontSize: 12,
                  color: "var(--ap-ink)",
                  fontFamily: "var(--ap-font-mono)",
                  letterSpacing: "0.06em",
                  fontWeight: 500,
                }}
              >
                <span aria-hidden="true">{PLATFORM_ICONS[p.toLowerCase()] ?? "·"}</span>
                {PLATFORM_LABELS[p.toLowerCase()] ?? p}
              </span>
            ))}
          </div>

          {allIssues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {allIssues.map((issue, i) => (
                <IssueLine key={i} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueLine({
  issue,
}: {
  issue: {
    severity: "blocker" | "warning" | "tip";
    message: string;
    recommendation?: string;
    platform: string;
  };
}) {
  const Icon =
    issue.severity === "blocker"
      ? AlertTriangle
      : issue.severity === "warning"
        ? AlertTriangle
        : Lightbulb;
  const color =
    issue.severity === "blocker"
      ? "var(--ap-stamp)"
      : issue.severity === "warning"
        ? "#D4A627"
        : "#6B7A2E";

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "8px 12px",
        background: "var(--ap-paper-2)",
        borderLeft: `2px solid ${color}`,
        fontSize: 12,
        color: "var(--ap-ink-2)",
        lineHeight: 1.5,
      }}
    >
      <Icon strokeWidth={1.8} style={{ width: 14, height: 14, color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 500 }}>
          [{PLATFORM_LABELS[issue.platform.toLowerCase()] ?? issue.platform}]
        </span>{" "}
        {issue.message}
        {issue.recommendation && (
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ap-ink-3)", fontStyle: "italic" }}>
            → {issue.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  const dayMs = 86_400_000;

  if (Math.abs(diff) < 3600_000) return "ahora";
  if (diff > 0 && diff < dayMs)
    return `en ${Math.round(diff / 3600_000)}h`;
  if (diff > 0 && diff < 7 * dayMs) {
    const days = Math.round(diff / dayMs);
    return days === 1 ? "mañana" : `en ${days} días`;
  }

  return date.toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Re-export para que TypeScript no se queje del import desde @prisma
export type { SocialPlatform };
