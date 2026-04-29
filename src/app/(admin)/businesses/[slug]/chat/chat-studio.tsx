"use client";

/**
 * Chat IA — generador completo de posts dentro del business.
 *
 * Flujo:
 *   1. Selector de formato: post / carrusel / reel / story (sólo reel/story
 *      aún no genera vídeo, llega en Sprint 4 con Kling)
 *   2. Aspect ratio derivado del formato (1:1 feed, 4:5 vertical, 9:16 reel)
 *   3. Drag-drop de imágenes de referencia (opcional, sirve para el visual
 *      style — Sprint 4 con FLUX Kontext + IP-Adapter)
 *   4. Prompt textarea
 *   5. Click "Generar" → llama paralelamente:
 *      - /api/ai/caption (Claude o Llama según providers configurados)
 *      - /api/ai/image (FLUX dev por defecto)
 *   6. Resultado con regenerate por elemento + "Programar este post" → upload page
 */
import { useState, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface Props {
  businessId: string;
  businessName: string;
  businessSlug: string;
  brandLevel: string;
  brandTone: string | null;
  brandNiche: string | null;
}

type PostFormat = "feed" | "carousel" | "reel" | "story";
type Quality = "schnell" | "dev" | "pro";

interface FormatConfig {
  label: string;
  ratio: "1:1" | "4:5" | "9:16";
  imagesCount: number;
  description: string;
  comingSoon?: boolean;
}

const FORMATS: Record<PostFormat, FormatConfig> = {
  feed: {
    label: "Post sencillo",
    ratio: "4:5",
    imagesCount: 1,
    description: "1 imagen vertical 4:5 + caption + hashtags",
  },
  carousel: {
    label: "Carrusel",
    ratio: "1:1",
    imagesCount: 4,
    description: "4 imágenes 1:1 coordinadas + caption",
  },
  reel: {
    label: "Reel / B-roll",
    ratio: "9:16",
    imagesCount: 1,
    description: "Storyboard 9:16 (vídeo Kling llega Sprint 4)",
  },
  story: {
    label: "Story",
    ratio: "9:16",
    imagesCount: 1,
    description: "1 imagen 9:16 con texto overlay",
  },
};

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export function ChatStudio({
  businessId,
  businessName,
  businessSlug,
  brandLevel,
  brandTone,
  brandNiche,
}: Props) {
  const { toast } = useToast();
  const [format, setFormat] = useState<PostFormat>("feed");
  const [quality, setQuality] = useState<Quality>("dev");
  const [prompt, setPrompt] = useState("");
  const [referenceUrls, setReferenceUrls] = useState<string[]>([""]);

  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState("");

  const cfg = FORMATS[format];
  const cost = (() => {
    const captionC = 1;
    const imgUnit = quality === "schnell" ? 1 : quality === "dev" ? 3 : 5;
    return captionC + imgUnit * cfg.imagesCount;
  })();

  const generateCaption = useCallback(async () => {
    if (prompt.trim().length < 3) {
      setError("Escribe un prompt más detallado.");
      return;
    }
    setError("");
    setGeneratingCaption(true);
    setCaption("");

    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          brief: `${prompt.trim()}\n\nFormato: ${cfg.label}.${
            referenceUrls.filter((u) => u.trim()).length > 0
              ? `\nReferencias visuales: ${referenceUrls.filter((u) => u.trim()).length} imagen(es) adjuntas.`
              : ""
          }`,
          channel: format === "story" ? "story" : format === "reel" ? "reel" : "feed",
          length: format === "story" ? "short" : "medium",
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 402) {
          setError(`Sin créditos. Tienes ${data.remaining?.total ?? 0}.`);
          return;
        }
        if (res.status === 503) {
          setError("AI no configurada. Pídele al admin que active TOGETHER_API_KEY.");
          return;
        }
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      // Parse SSE
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          let event = "", data = "";
          for (const line of evt.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!event) continue;
          try {
            const payload = JSON.parse(data);
            if (event === "chunk" && typeof payload.text === "string") {
              acc += payload.text;
              setCaption(acc);
            } else if (event === "done" && typeof payload.text === "string") {
              acc = payload.text;
              setCaption(acc);
            } else if (event === "error") {
              setError(payload.error ?? "Error en streaming");
            } else if (event === "usage") {
              window.dispatchEvent(new CustomEvent("credits-updated"));
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setGeneratingCaption(false);
    }
  }, [prompt, businessId, format, cfg, referenceUrls]);

  const generateImages = useCallback(async () => {
    if (prompt.trim().length < 3) {
      setError("Escribe un prompt más detallado.");
      return;
    }
    setError("");
    setGeneratingImages(true);
    setImages([]);

    try {
      const enrichedPrompt = (() => {
        const refs = referenceUrls.filter((u) => u.trim()).length;
        const lines = [prompt.trim()];
        if (brandTone) lines.push(`Estilo de marca: ${brandTone.replace(/_/g, " ")}.`);
        if (brandNiche) lines.push(`Nicho: ${brandNiche}.`);
        if (refs > 0) lines.push(`Inspirado en ${refs} imagen(es) de referencia subidas.`);
        return lines.join(" ");
      })();

      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          prompt: enrichedPrompt,
          model: quality,
          aspectRatio: cfg.ratio,
          count: cfg.imagesCount,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setError(`Sin créditos. Tienes ${data.remaining?.total ?? 0}.`);
        return;
      }
      if (res.status === 503) {
        setError(
          "Generación de imagen no disponible. Configura TOGETHER_API_KEY en Railway.",
        );
        return;
      }
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setImages(data.images as GeneratedImage[]);
      window.dispatchEvent(new CustomEvent("credits-updated"));
      toast(
        `${data.images.length} imagen${data.images.length > 1 ? "es" : ""} listas`,
        "success",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setGeneratingImages(false);
    }
  }, [prompt, businessId, quality, cfg, referenceUrls, brandTone, brandNiche, toast]);

  const generateAll = useCallback(async () => {
    await Promise.all([generateCaption(), generateImages()]);
  }, [generateCaption, generateImages]);

  function setRefUrl(i: number, v: string) {
    setReferenceUrls((arr) => {
      const next = [...arr];
      next[i] = v;
      return next;
    });
  }
  function addRef() {
    if (referenceUrls.length < 5) setReferenceUrls([...referenceUrls, ""]);
  }
  function removeRef(i: number) {
    setReferenceUrls(referenceUrls.filter((_, idx) => idx !== i));
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 24,
      }}
    >
      <p
        className="ap-mono"
        style={{
          fontSize: 11,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        Brand DNA · {brandLevel} {brandTone ? `· ${brandTone.replace(/_/g, " ")}` : ""}{brandNiche ? ` · ${brandNiche}` : ""}
      </p>
      <h2
        className="ap-display"
        style={{
          fontSize: "clamp(28px, 4vw, 40px)",
          fontStyle: "italic",
          lineHeight: 1,
          margin: "0 0 4px",
          color: "var(--ap-ink)",
        }}
      >
        Genera un post completo
      </h2>
      <p style={{ fontSize: 14, color: "var(--ap-ink-3)", margin: "0 0 20px" }}>
        Selecciona formato, da prompt + referencias opcionales, y la IA crea caption + imagen(es)
        con la voz de <strong>{businessName}</strong>.
      </p>

      {/* Form */}
      <div style={{ display: "grid", gap: 22 }}>
        {/* 1. Format selector */}
        <Section number="01" title="Formato del post">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
            }}
          >
            {(Object.keys(FORMATS) as PostFormat[]).map((k) => {
              const f = FORMATS[k];
              const active = format === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFormat(k)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    background: active ? "var(--ap-paper)" : "transparent",
                    border: active ? "2px solid var(--ap-stamp)" : "1px solid var(--ap-line-2)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    color: "var(--ap-ink)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
                    {f.label}{" "}
                    <span
                      className="ap-mono"
                      style={{
                        fontSize: 9,
                        color: "var(--ap-ink-4)",
                        marginLeft: 4,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {f.ratio}
                    </span>
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11,
                      color: "var(--ap-ink-3)",
                      fontStyle: "italic",
                    }}
                  >
                    {f.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 2. Calidad */}
        <Section number="02" title="Calidad de imagen">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["schnell", "dev", "pro"] as Quality[]).map((q) => {
              const active = quality === q;
              const credCost = q === "schnell" ? 1 : q === "dev" ? 3 : 5;
              const labels = {
                schnell: "Rápida",
                dev: "Estándar",
                pro: "Hero shot",
              };
              return (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className="ap-mono"
                  style={{
                    padding: "8px 14px",
                    background: active ? "var(--ap-stamp)" : "transparent",
                    border: active
                      ? "1px solid var(--ap-stamp)"
                      : "1px solid var(--ap-line-2)",
                    color: active ? "var(--ap-paper)" : "var(--ap-ink-2)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {labels[q]} · {credCost} cred/img
                </button>
              );
            })}
          </div>
        </Section>

        {/* 3. Reference images (URL-based for now, drag-drop en Sprint 4) */}
        <Section
          number="03"
          title="Imágenes de referencia (opcional)"
          subtitle="Pega URLs de imágenes que reflejen el mood/estilo que quieres. La IA las usa como inspiración."
        >
          {referenceUrls.map((url, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setRefUrl(i, e.target.value)}
                placeholder="https://… (Pinterest, Instagram, tu sitio…)"
                style={inputStyle}
              />
              {url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    objectFit: "cover",
                    border: "1px solid var(--ap-line-2)",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              {referenceUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRef(i)}
                  style={removeBtnStyle}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {referenceUrls.length < 5 && (
            <button type="button" onClick={addRef} style={addBtnStyle}>
              + Añadir referencia
            </button>
          )}
        </Section>

        {/* 4. Prompt */}
        <Section
          number="04"
          title="Prompt"
          subtitle="Describe el post: qué quieres comunicar, qué pasa en la imagen, palabras clave."
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Ej: Anuncia el evento del sábado 22 a las 21h. Vibe nocturno editorial, gente bailando con luces tomate sobre fondo oscuro. Llamada a guardar plaza vía link en bio."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 11,
              color: "var(--ap-ink-4)",
              fontStyle: "italic",
            }}
          >
            {prompt.length}/2000
          </p>
        </Section>

        {/* 5. Generate buttons */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            paddingTop: 6,
            borderTop: "1px solid var(--ap-line)",
          }}
        >
          <button
            type="button"
            onClick={generateAll}
            disabled={generatingCaption || generatingImages || prompt.trim().length < 3}
            className="ap-btn ap-btn--stamp"
            style={{
              padding: "12px 22px",
              fontSize: 13,
              opacity: generatingCaption || generatingImages || prompt.trim().length < 3 ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            ✦ Generar todo
            <span
              className="ap-mono"
              style={{ fontSize: 9, opacity: 0.8, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              −{cost} cred
            </span>
          </button>
          <button
            type="button"
            onClick={generateCaption}
            disabled={generatingCaption}
            className="ap-btn ap-btn--ghost"
            style={{ padding: "12px 18px", fontSize: 12, opacity: generatingCaption ? 0.5 : 1 }}
          >
            {generatingCaption ? "Generando…" : "Solo caption (−1 cred)"}
          </button>
          <button
            type="button"
            onClick={generateImages}
            disabled={generatingImages}
            className="ap-btn ap-btn--ghost"
            style={{ padding: "12px 18px", fontSize: 12, opacity: generatingImages ? 0.5 : 1 }}
          >
            {generatingImages
              ? "Generando…"
              : `Solo imagen${cfg.imagesCount > 1 ? "es" : ""} (−${(quality === "schnell" ? 1 : quality === "dev" ? 3 : 5) * cfg.imagesCount} cred)`}
          </button>
        </div>

        {/* 6. Resultado */}
        {(caption || images.length > 0 || generatingCaption || generatingImages) && (
          <div
            style={{
              padding: 22,
              background: "var(--ap-paper-2)",
              border: "1px solid var(--ap-line-2)",
              display: "grid",
              gap: 18,
            }}
          >
            <p
              className="ap-mono"
              style={{
                fontSize: 11,
                color: "var(--ap-stamp)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              ✦ Resultado
            </p>

            {/* Caption */}
            {(caption || generatingCaption) && (
              <div>
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}
                >
                  Caption {generatingCaption ? "· escribiendo…" : ""}
                </p>
                <div
                  aria-live="polite"
                  style={{
                    background: "var(--ap-paper)",
                    border: "1px solid var(--ap-line)",
                    padding: "14px 16px",
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "var(--ap-ink-2)",
                    whiteSpace: "pre-wrap",
                    minHeight: 80,
                  }}
                >
                  {caption || (generatingCaption && (
                    <span style={{ color: "var(--ap-ink-4)", fontStyle: "italic" }}>
                      Esperando…
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div>
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    margin: "0 0 8px",
                  }}
                >
                  Imágenes generadas · {cfg.ratio}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                    gap: 8,
                  }}
                >
                  {images.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        aspectRatio: cfg.ratio.replace(":", " / "),
                        background: "var(--ap-paper)",
                        border: "1px solid var(--ap-line-2)",
                        overflow: "hidden",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`Imagen generada ${i + 1}`}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action: programar este post */}
            {(caption || images.length > 0) && !generatingCaption && !generatingImages && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={generateAll}
                  className="ap-btn ap-btn--ghost"
                  style={{ padding: "10px 16px", fontSize: 12 }}
                >
                  ↻ Regenerar todo
                </button>
                <Link
                  href={`/businesses/${businessSlug}/upload`}
                  className="ap-btn ap-btn--stamp"
                  style={{ padding: "10px 16px", fontSize: 12 }}
                >
                  Programar este post →
                </Link>
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 11,
                    color: "var(--ap-ink-4)",
                    fontStyle: "italic",
                    flex: "1 0 100%",
                  }}
                >
                  Tip: copia caption + descarga imágenes y súbelas en el calendario para programar la publicación.
                  Sprint 4 hará este flujo automático.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              background: "var(--ap-paper-2)",
              borderLeft: "2px solid var(--ap-stamp)",
              fontSize: 13,
              color: "var(--ap-ink-2)",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: "0 0 4px",
        }}
      >
        {number} · {title}
      </p>
      {subtitle && (
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 12,
            color: "var(--ap-ink-3)",
            fontStyle: "italic",
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--ap-paper)",
  border: "1px solid var(--ap-line-2)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  color: "var(--ap-ink)",
  lineHeight: 1.55,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
const addBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px dashed var(--ap-line-2)",
  padding: "8px 14px",
  fontSize: 11,
  color: "var(--ap-ink-3)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  cursor: "pointer",
  fontFamily: "var(--ap-font-mono)",
};
const removeBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid var(--ap-line-2)",
  padding: "8px 12px",
  fontSize: 14,
  color: "var(--ap-ink-3)",
  cursor: "pointer",
  minWidth: 40,
};
