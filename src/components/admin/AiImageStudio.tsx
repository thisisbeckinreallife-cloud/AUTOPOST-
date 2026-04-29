"use client";

/**
 * Estudio de imágenes IA — embebido en post editor.
 *
 * Flujo:
 *   1. Usuario escribe prompt + selecciona modelo (schnell/dev/pro) + ratio + count
 *   2. Click "Generar" → POST /api/ai/image → resultado con URLs
 *   3. Click sobre cualquier imagen → "Usar como portada del post"
 *      (descarga + añade a mediaAssets del PostDraft) — TODO Sprint 2.5
 *   4. Mientras tanto, las URLs son visibles para que el usuario las descargue manualmente
 *
 * Costes mostrados al usuario (1 cred = $0.10 retail):
 *   - schnell: 1 cred/imagen
 *   - dev: 3 cred/imagen
 *   - pro: 5 cred/imagen
 */
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

type Model = "schnell" | "dev" | "pro";
type Ratio = "1:1" | "4:5" | "9:16" | "16:9";

const MODEL_CONFIG: Record<
  Model,
  { label: string; subtitle: string; credits: number }
> = {
  schnell: { label: "Rápida", subtitle: "Iteración veloz · FLUX schnell", credits: 1 },
  dev: { label: "Estándar", subtitle: "Calidad pro · FLUX dev", credits: 3 },
  pro: { label: "Hero shot", subtitle: "Premium · FLUX 1.1 pro", credits: 5 },
};

const RATIO_CONFIG: Record<Ratio, { label: string; sub: string }> = {
  "1:1": { label: "1:1", sub: "Feed cuadrado" },
  "4:5": { label: "4:5", sub: "Feed vertical" },
  "9:16": { label: "9:16", sub: "Reel / Story" },
  "16:9": { label: "16:9", sub: "Landscape" },
};

interface Props {
  businessId: string;
  /**
   * Si se pasa, "Usar" llama a /api/ai/image/save y crea un MediaAsset
   * asociado a este post — cierra el loop generar → publicar.
   */
  postDraftId?: string;
  /**
   * Callback opcional para customizar el flujo de "Usar imagen". Si no se
   * pasa pero postDraftId está, el componente hace el save automático.
   */
  onPickImage?: (url: string, width: number, height: number) => void;
  /** Callback tras guardar exitosamente el asset (refresh post detail). */
  onAssetSaved?: () => void;
}

interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

export function AiImageStudio({
  businessId,
  postDraftId,
  onPickImage,
  onAssetSaved,
}: Props) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [model, setModel] = useState<Model>("dev");
  const [aspectRatio, setAspectRatio] = useState<Ratio>("1:1");
  const [count, setCount] = useState<1 | 2 | 3 | 4>(1);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState("");
  const [costInfo, setCostInfo] = useState<{ creditsCost: number; costUsd: number } | null>(
    null,
  );

  const totalCredits = MODEL_CONFIG[model].credits * count;

  async function handleGenerate() {
    if (prompt.trim().length < 3) {
      setError("El prompt es demasiado corto.");
      return;
    }
    setError("");
    setImages([]);
    setCostInfo(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          prompt: prompt.trim(),
          model,
          aspectRatio,
          count,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setError(
          `Sin créditos. Tienes ${data.remaining?.total ?? 0} y necesitas ${totalCredits}.`,
        );
        toast("Sin créditos — compra un pack", "info");
        window.dispatchEvent(new CustomEvent("credits-updated"));
        return;
      }
      if (res.status === 503) {
        setError(
          "Generación de imagen no disponible. Pídele al admin que configure TOGETHER_API_KEY.",
        );
        return;
      }
      if (!res.ok) {
        toast(data.error ?? "No se pudo generar", "error");
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setImages(data.images as GeneratedImage[]);
      setCostInfo({ creditsCost: data.creditsCost, costUsd: data.costUsd });
      window.dispatchEvent(new CustomEvent("credits-updated"));
      toast(`${data.images.length} imagen${data.images.length > 1 ? "es" : ""} lista${data.images.length > 1 ? "s" : ""}`, "success");
    } catch (err) {
      const m = err instanceof Error ? err.message : "Error de red";
      setError(m);
      toast("Error al generar imagen", "error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "clamp(20px, 3vw, 32px)",
      }}
      aria-label="Estudio de imágenes AI"
    >
      <header style={{ marginBottom: 18 }}>
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
          ✦ Estudio de imágenes
        </p>
        <h3
          className="ap-display"
          style={{
            fontSize: "clamp(22px, 3vw, 28px)",
            fontStyle: "italic",
            lineHeight: 1,
            color: "var(--ap-ink)",
            margin: "6px 0 0",
            letterSpacing: "-0.01em",
          }}
        >
          Generar visual con IA
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--ap-ink-3)",
            margin: "8px 0 0",
            fontStyle: "italic",
          }}
        >
          FLUX vía Together.AI · 4 ratios · 3 niveles de calidad.
        </p>
      </header>

      {/* Prompt */}
      <div style={{ display: "grid", gap: 12 }}>
        <label
          className="ap-mono"
          htmlFor="img-prompt"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Prompt
        </label>
        <textarea
          id="img-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Café latte art servido en taza de cerámica oscura, luz natural lateral, vibe minimalista editorial, fondo desenfocado..."
          rows={3}
          maxLength={2000}
          disabled={generating}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ap-ink)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--ap-line-2)")}
        />

        {/* Selectors */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
          }}
        >
          {/* Model */}
          <div>
            <FieldLabel htmlFor="img-model">Calidad</FieldLabel>
            <select
              id="img-model"
              value={model}
              onChange={(e) => setModel(e.target.value as Model)}
              disabled={generating}
              style={selectStyle}
            >
              {(["schnell", "dev", "pro"] as Model[]).map((k) => (
                <option key={k} value={k}>
                  {MODEL_CONFIG[k].label} · {MODEL_CONFIG[k].credits} cred
                </option>
              ))}
            </select>
            <p style={tinyHelp}>{MODEL_CONFIG[model].subtitle}</p>
          </div>

          {/* Ratio */}
          <div>
            <FieldLabel htmlFor="img-ratio">Aspect ratio</FieldLabel>
            <select
              id="img-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as Ratio)}
              disabled={generating}
              style={selectStyle}
            >
              {(["1:1", "4:5", "9:16", "16:9"] as Ratio[]).map((r) => (
                <option key={r} value={r}>
                  {RATIO_CONFIG[r].label} · {RATIO_CONFIG[r].sub}
                </option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div>
            <FieldLabel htmlFor="img-count">Variaciones</FieldLabel>
            <select
              id="img-count"
              value={count}
              onChange={(e) => setCount(Number(e.target.value) as 1 | 2 | 3 | 4)}
              disabled={generating}
              style={selectStyle}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "imagen" : "imágenes"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || prompt.trim().length < 3}
            className="ap-btn ap-btn--stamp"
            style={{
              padding: "12px 20px",
              fontSize: 13,
              opacity: generating || prompt.trim().length < 3 ? 0.5 : 1,
              cursor: generating || prompt.trim().length < 3 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {generating ? "Generando…" : "Generar"}
            <span
              className="ap-mono"
              style={{ fontSize: 9, opacity: 0.7, letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              −{totalCredits} cred
            </span>
          </button>
          {costInfo && (
            <span
              className="ap-mono"
              title={`Coste real Anthropic+Together: $${costInfo.costUsd.toFixed(4)}`}
              style={{
                fontSize: 10,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {costInfo.creditsCost} cred · {(costInfo.costUsd * 100).toFixed(2)}¢
            </span>
          )}
        </div>
      </div>

      {/* Result gallery */}
      {images.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <hr className="ap-rule" style={{ marginBottom: 18, opacity: 0.5 }} />
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
            Resultado · {images.length} {images.length === 1 ? "imagen" : "imágenes"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(${images.length === 1 ? 320 : 200}px, 1fr))`,
              gap: 12,
            }}
          >
            {images.map((img, i) => (
              <ImageCard
                key={i}
                image={img}
                saving={savingIdx === i}
                onPick={
                  // Caso 1: callback custom
                  onPickImage
                    ? () => onPickImage(img.url, img.width, img.height)
                    : // Caso 2: auto-save al post si postDraftId está
                      postDraftId
                      ? async () => {
                          setSavingIdx(i);
                          try {
                            const res = await fetch("/api/ai/image/save", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                postDraftId,
                                imageUrl: img.url,
                                width: img.width,
                                height: img.height,
                                promptUsed: prompt.trim(),
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) {
                              toast(
                                data.error ?? "No se pudo guardar la imagen",
                                "error",
                              );
                              return;
                            }
                            toast("Imagen añadida al post", "success");
                            onAssetSaved?.();
                          } catch {
                            toast("Error de red al guardar", "error");
                          } finally {
                            setSavingIdx(null);
                          }
                        }
                      : undefined
                }
                aspectRatio={aspectRatio}
              />
            ))}
          </div>
          <p
            style={{
              marginTop: 14,
              fontSize: 12,
              color: "var(--ap-ink-4)",
              fontStyle: "italic",
            }}
          >
            Las URLs son temporales (Together las hospeda 1h).
            {onPickImage ? " Click sobre una para usarla en el post." : " Descárgalas si quieres conservarlas."}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "var(--ap-paper)",
            borderLeft: "2px solid var(--ap-stamp)",
            fontSize: 13,
            color: "var(--ap-ink-2)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function ImageCard({
  image,
  onPick,
  aspectRatio,
  saving,
}: {
  image: GeneratedImage;
  onPick?: () => void;
  aspectRatio: string;
  saving?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: aspectRatio.replace(":", " / "),
        background: "var(--ap-paper)",
        border: "1px solid var(--ap-line-2)",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt="Imagen generada"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 8,
          background:
            "linear-gradient(to top, rgba(20,17,13,0.7) 0%, transparent 35%)",
          opacity: 0,
          transition: "opacity 200ms ease-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0";
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {onPick && (
            <button
              type="button"
              onClick={onPick}
              disabled={saving}
              className="ap-btn ap-btn--stamp"
              style={{
                padding: "6px 10px",
                fontSize: 10,
                fontFamily: "var(--ap-font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                opacity: saving ? 0.5 : 1,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Guardando…" : "Usar"}
            </button>
          )}
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="ap-mono"
            style={{
              padding: "6px 10px",
              background: "var(--ap-paper)",
              color: "var(--ap-ink)",
              border: "1px solid var(--ap-ink)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            ↗ Abrir
          </a>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--ap-paper)",
  border: "1px solid var(--ap-line-2)",
  padding: "12px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  color: "var(--ap-ink)",
  lineHeight: 1.55,
  resize: "vertical",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  background: "var(--ap-paper)",
  border: "1px solid var(--ap-line-2)",
  padding: "9px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  color: "var(--ap-ink)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const tinyHelp: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 10,
  color: "var(--ap-ink-4)",
  fontStyle: "italic",
};

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
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
      {children}
    </label>
  );
}
