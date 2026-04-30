"use client";

/**
 * InstagramMockup — vista previa fiel de cómo se vería un PostDraft
 * en el feed de Instagram. Útil para que el user valide cómo queda
 * la composición antes de publicar.
 *
 * Características:
 *   - Header con avatar + username + verified check (si aplica)
 *   - Carrusel navegable con dots indicadores (si tiene varias imágenes)
 *   - Iconos like / comment / share / save (decorativos, no funcionan)
 *   - Caption truncado a 2 líneas con "...más" expandible
 *   - Hashtags coloreados azul-zinc
 *   - "ver los X comentarios" mock
 *   - Tiempo relativo formateado ("hace 2h", "ayer")
 *   - Para REEL: chrome de Reels overlay
 *
 * Tipografía SF-system para que se sienta "nativo" iOS.
 */
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Music2,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MediaAsset {
  id: string;
  storageUrl: string;
  mimeType: string;
  sortOrder: number;
}

interface Props {
  username: string;
  avatarUrl?: string | null;
  caption: string;
  postType: string; // IMAGE | CAROUSEL | REEL
  mediaAssets: MediaAsset[];
  publishAt?: string;
}

export function InstagramMockup({
  username,
  avatarUrl,
  caption,
  postType,
  mediaAssets,
  publishAt,
}: Props) {
  const sortedAssets = mediaAssets.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const isCarousel = postType === "CAROUSEL" && sortedAssets.length > 1;
  const isReel = postType === "REEL";

  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(true);

  const activeAsset = sortedAssets[activeIndex];

  // Caption con hashtags coloreados
  const captionParts = caption.split(/(#[\w_]+)/g);

  // Tiempo relativo
  const timeLabel = publishAt ? formatRelative(new Date(publishAt)) : "ahora";

  return (
    <div
      style={{
        maxWidth: 470,
        margin: "0 auto",
        background: "#FFFFFF",
        border: "1px solid #DBDBDB",
        borderRadius: 8,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif',
        color: "#262626",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 14px",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background:
              "linear-gradient(45deg, #F09433 0%, #E6683C 25%, #DC2743 50%, #CC2366 75%, #BC1888 100%)",
            padding: 2,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "#FFFFFF",
              padding: 2,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover`
                  : "linear-gradient(135deg, #14110D 0%, #4A4538 100%)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {!avatarUrl && username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: "#262626",
              lineHeight: 1.2,
            }}
          >
            {username}
          </p>
          <p
            style={{
              margin: "1px 0 0",
              fontSize: 11,
              color: "#737373",
              lineHeight: 1,
            }}
          >
            Patrocinado · {timeLabel}
          </p>
        </div>

        <MoreHorizontal strokeWidth={2} style={{ width: 20, height: 20, color: "#262626" }} />
      </div>

      {/* Media area */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: isReel ? "9 / 16" : "1 / 1",
          background: "#000000",
          maxHeight: isReel ? 580 : 470,
          overflow: "hidden",
        }}
      >
        {activeAsset?.mimeType.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeAsset.storageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : activeAsset?.mimeType.startsWith("video/") ? (
          <video
            key={activeAsset.id}
            src={activeAsset.storageUrl}
            autoPlay
            loop
            muted={muted}
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              color: "#FFF",
              padding: 40,
              textAlign: "center",
              fontSize: 13,
              opacity: 0.6,
            }}
          >
            Sin media
          </div>
        )}

        {/* Carousel dots + arrows */}
        {isCarousel && (
          <>
            {activeIndex > 0 && (
              <button
                type="button"
                onClick={() => setActiveIndex((i) => i - 1)}
                aria-label="Anterior"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 8,
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.85)",
                  border: "none",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft strokeWidth={2.5} style={{ width: 14, height: 14, color: "#262626" }} />
              </button>
            )}
            {activeIndex < sortedAssets.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveIndex((i) => i + 1)}
                aria-label="Siguiente"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: 8,
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,0.85)",
                  border: "none",
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronRight strokeWidth={2.5} style={{ width: 14, height: 14, color: "#262626" }} />
              </button>
            )}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.5)",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 12,
              }}
            >
              {activeIndex + 1}/{sortedAssets.length}
            </div>
          </>
        )}

        {/* Reel chrome */}
        {isReel && (
          <>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {muted ? (
                <VolumeX strokeWidth={2} style={{ width: 16, height: 16, color: "#FFF" }} />
              ) : (
                <Volume2 strokeWidth={2} style={{ width: 16, height: 16, color: "#FFF" }} />
              )}
            </button>

            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 14,
                right: 14,
                color: "#FFF",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Music2 strokeWidth={2} style={{ width: 12, height: 12 }} />
              <span>Audio original · {username}</span>
            </div>
          </>
        )}
      </div>

      {/* Carousel dots indicator (debajo) */}
      {isCarousel && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            padding: "8px 0",
          }}
        >
          {sortedAssets.map((_, i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i === activeIndex ? "#0095F6" : "#A8A8A8",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      )}

      {/* Action bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          gap: 14,
        }}
      >
        <Heart strokeWidth={1.8} style={{ width: 24, height: 24, color: "#262626" }} />
        <MessageCircle strokeWidth={1.8} style={{ width: 24, height: 24, color: "#262626" }} />
        <Send strokeWidth={1.8} style={{ width: 22, height: 22, color: "#262626" }} />
        <Bookmark
          strokeWidth={1.8}
          style={{ width: 22, height: 22, color: "#262626", marginLeft: "auto" }}
        />
      </div>

      {/* Likes */}
      <div style={{ padding: "0 12px", marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#262626" }}>
          Le gusta a <span style={{ fontWeight: 700 }}>tu_amig@</span> y otras
          personas
        </p>
      </div>

      {/* Caption */}
      <div style={{ padding: "4px 12px 4px", fontSize: 14, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600, marginRight: 6 }}>{username}</span>
        {expanded ? (
          <span style={{ whiteSpace: "pre-wrap" }}>
            {captionParts.map((part, i) =>
              part.startsWith("#") ? (
                <span key={i} style={{ color: "#00376B" }}>
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </span>
        ) : (
          <span>
            {captionParts.slice(0, 8).map((part, i) =>
              part.startsWith("#") ? (
                <span key={i} style={{ color: "#00376B" }}>
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
            {captionParts.length > 8 && (
              <>
                {"... "}
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#737373",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                  }}
                >
                  más
                </button>
              </>
            )}
          </span>
        )}
      </div>

      {/* Comments mock */}
      <div style={{ padding: "4px 12px", marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#737373" }}>
          Ver los 24 comentarios
        </p>
      </div>

      {/* Time */}
      <div style={{ padding: "0 12px 12px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: "#737373",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {timeLabel}
        </p>
      </div>
    </div>
  );
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();

  // Si es futuro
  if (diff < 0) {
    const futureDiff = -diff;
    if (futureDiff < 60_000) return "en un instante";
    if (futureDiff < 3_600_000) return `en ${Math.round(futureDiff / 60_000)}min`;
    if (futureDiff < 86_400_000) return `en ${Math.round(futureDiff / 3_600_000)}h`;
    if (futureDiff < 604_800_000) return `en ${Math.round(futureDiff / 86_400_000)}d`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  if (diff < 60_000) return "ahora";
  if (diff < 3_600_000) return `hace ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.round(diff / 3_600_000)} h`;
  if (diff < 604_800_000) return `hace ${Math.round(diff / 86_400_000)} d`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
