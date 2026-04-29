"use client";

/**
 * Estudio editorial AI — panel embebido en el detalle de un post.
 *
 * Flujo:
 *   1. Usuario escribe brief breve + (opcional) canal/longitud.
 *   2. POST /api/ai/caption con SSE → preview con typewriter.
 *   3. "Usar este caption" → PATCH /api/posts/[postId] con caption.
 *   4. Tras tener un caption, "Generar hashtags" → POST /api/ai/hashtags
 *      → muestra primary/secondary + "Añadir al caption".
 *
 * Branding editorial: sin radius, hairlines, ap-display italic, ap-mono kickers,
 * sello tomate (--ap-stamp) para el estado activo.
 */
import { useCallback, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

interface Props {
  postId: string;
  businessId: string;
  currentCaption: string;
  onApplied: (caption: string) => void;
}

interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUsd: number;
  model: string;
}

interface HashtagsResponse {
  primary: string[];
  secondary: string[];
  usage: UsageInfo;
}

type Channel = "feed" | "reel" | "story";
type Length = "short" | "medium" | "long";

export function AiCaptionStudio({
  postId,
  businessId,
  currentCaption,
  onApplied,
}: Props) {
  const { toast } = useToast();
  const [brief, setBrief] = useState("");
  const [channel, setChannel] = useState<Channel>("feed");
  const [length, setLength] = useState<Length>("medium");
  const [generating, setGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [error, setError] = useState("");

  const [generatingHashtags, setGeneratingHashtags] = useState(false);
  const [hashtags, setHashtags] = useState<HashtagsResponse | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = useCallback(async () => {
    if (brief.trim().length < 3) {
      setError("El brief es demasiado corto.");
      return;
    }
    setError("");
    setStreamedText("");
    setUsage(null);
    setGenerating(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, brief: brief.trim(), channel, length }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `HTTP ${res.status}`);
        toast(data.error ?? "Error al generar", "error");
        return;
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const lines = evt.split("\n");
          let event = "";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) data += line.slice(5).trim();
          }
          if (!event) continue;

          try {
            const payload = JSON.parse(data);
            if (event === "chunk" && typeof payload.text === "string") {
              accumulated += payload.text;
              setStreamedText(accumulated);
            } else if (event === "usage") {
              setUsage(payload as UsageInfo);
            } else if (event === "done" && typeof payload.text === "string") {
              accumulated = payload.text;
              setStreamedText(accumulated);
            } else if (event === "error") {
              setError(payload.error ?? "Error desconocido");
              toast(payload.error ?? "Error en streaming", "error");
            }
          } catch {
            // Ignore malformed event
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        toast("Conexión interrumpida", "error");
      }
    } finally {
      setGenerating(false);
    }
  }, [brief, businessId, channel, length, toast]);

  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
  }, []);

  const handleApply = useCallback(async () => {
    if (!streamedText.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: streamedText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "No se pudo aplicar", "error");
        return;
      }
      onApplied(streamedText);
      toast("Caption aplicado", "success");
    } catch {
      toast("Error de red", "error");
    }
  }, [postId, streamedText, onApplied, toast]);

  const handleGenerateHashtags = useCallback(async () => {
    const captionForTags = streamedText.trim() || currentCaption.trim();
    if (captionForTags.length < 3) {
      setError("Necesitas un caption antes de generar hashtags.");
      return;
    }
    setError("");
    setGeneratingHashtags(true);
    setHashtags(null);
    try {
      const res = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, caption: captionForTags }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "No se pudieron generar hashtags", "error");
        return;
      }
      setHashtags(data as HashtagsResponse);
    } catch {
      toast("Error de red", "error");
    } finally {
      setGeneratingHashtags(false);
    }
  }, [businessId, streamedText, currentCaption, toast]);

  const handleAppendHashtags = useCallback(
    async (group: "primary" | "secondary" | "all") => {
      if (!hashtags) return;
      const tags =
        group === "primary"
          ? hashtags.primary
          : group === "secondary"
            ? hashtags.secondary
            : [...hashtags.primary, ...hashtags.secondary];
      const baseCaption = streamedText.trim() || currentCaption.trim();
      const appended = `${baseCaption}\n\n${tags.join(" ")}`;
      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caption: appended }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast(data.error ?? "No se pudo aplicar", "error");
          return;
        }
        setStreamedText(appended);
        onApplied(appended);
        toast("Hashtags añadidos", "success");
      } catch {
        toast("Error de red", "error");
      }
    },
    [hashtags, postId, streamedText, currentCaption, onApplied, toast],
  );

  const cacheRatio = usage
    ? usage.inputTokens + usage.cacheReadTokens > 0
      ? Math.round(
          (usage.cacheReadTokens /
            (usage.inputTokens + usage.cacheReadTokens)) *
            100,
        )
      : 0
    : 0;

  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "clamp(20px, 3vw, 32px)",
      }}
      aria-label="Estudio editorial AI"
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
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
            ✦ Estudio editorial
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
            Generar caption con IA
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--ap-ink-3)",
              margin: "8px 0 0",
              fontStyle: "italic",
            }}
          >
            Aprende la voz de tus últimos 30 posts publicados.
          </p>
        </div>
      </header>

      {/* Form */}
      <div style={{ display: "grid", gap: 12 }}>
        <label
          className="ap-mono"
          htmlFor="ai-brief"
          style={{
            fontSize: 11,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Brief
        </label>
        <textarea
          id="ai-brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe el post: qué pasa en la imagen, qué quieres comunicar, palabras clave que no pueden faltar..."
          rows={4}
          maxLength={2000}
          disabled={generating}
          style={{
            background: "var(--ap-paper)",
            border: "1px solid var(--ap-line-2)",
            padding: "12px 14px",
            fontSize: 14,
            fontFamily: "inherit",
            lineHeight: 1.55,
            color: "var(--ap-ink)",
            resize: "vertical",
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ap-ink)")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--ap-line-2)")
          }
        />

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <SelectField
            label="Canal"
            value={channel}
            onChange={(v) => setChannel(v as Channel)}
            options={[
              ["feed", "Feed"],
              ["reel", "Reel"],
              ["story", "Story"],
            ]}
            disabled={generating}
          />
          <SelectField
            label="Longitud"
            value={length}
            onChange={(v) => setLength(v as Length)}
            options={[
              ["short", "Corta"],
              ["medium", "Media"],
              ["long", "Larga"],
            ]}
            disabled={generating}
          />

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {generating ? (
              <button
                type="button"
                onClick={handleAbort}
                className="ap-btn ap-btn--ghost"
                style={{ padding: "12px 18px", fontSize: 13 }}
              >
                Detener
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={brief.trim().length < 3}
                className="ap-btn ap-btn--stamp"
                style={{
                  padding: "12px 18px",
                  fontSize: 13,
                  opacity: brief.trim().length < 3 ? 0.5 : 1,
                  cursor: brief.trim().length < 3 ? "not-allowed" : "pointer",
                }}
              >
                Generar caption
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Output */}
      {(streamedText || generating) && (
        <div style={{ marginTop: 24 }}>
          <hr
            className="ap-rule"
            style={{ marginBottom: 18, opacity: 0.5 }}
          />
          <p
            className="ap-mono"
            style={{
              fontSize: 11,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            Borrador editorial {generating ? "· escribiendo…" : ""}
          </p>
          <div
            aria-live="polite"
            style={{
              background: "var(--ap-paper)",
              border: "1px solid var(--ap-line)",
              padding: "16px 18px",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--ap-ink-2)",
              whiteSpace: "pre-wrap",
              minHeight: 80,
              fontFamily: "inherit",
            }}
          >
            {streamedText || (
              <span style={{ color: "var(--ap-ink-4)", fontStyle: "italic" }}>
                Esperando primer fragmento…
              </span>
            )}
            {generating && (
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 16,
                  marginLeft: 2,
                  background: "var(--ap-stamp)",
                  verticalAlign: "text-bottom",
                  animation: "ap-blink 0.8s steps(2) infinite",
                }}
                aria-hidden="true"
              />
            )}
          </div>

          {streamedText && !generating && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={handleApply}
                className="ap-btn ap-btn--stamp"
                style={{ padding: "10px 16px", fontSize: 13 }}
              >
                Usar este caption
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="ap-btn ap-btn--ghost"
                style={{ padding: "10px 16px", fontSize: 13 }}
              >
                Regenerar
              </button>
              <button
                type="button"
                onClick={handleGenerateHashtags}
                disabled={generatingHashtags}
                className="ap-btn ap-btn--ghost"
                style={{
                  padding: "10px 16px",
                  fontSize: 13,
                  opacity: generatingHashtags ? 0.5 : 1,
                }}
              >
                {generatingHashtags ? "Generando hashtags…" : "+ Hashtags"}
              </button>

              {usage && (
                <UsageBadge usage={usage} cacheRatio={cacheRatio} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Hashtags result */}
      {hashtags && (
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
            Hashtags generados
          </p>

          <HashtagGroup
            label="Nicho"
            tags={hashtags.primary}
            onAppend={() => handleAppendHashtags("primary")}
          />
          <HashtagGroup
            label="Cola larga"
            tags={hashtags.secondary}
            onAppend={() => handleAppendHashtags("secondary")}
          />

          <button
            type="button"
            onClick={() => handleAppendHashtags("all")}
            className="ap-btn ap-btn--stamp"
            style={{
              marginTop: 8,
              padding: "10px 16px",
              fontSize: 13,
            }}
          >
            Añadir todos al caption
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 18,
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

      <style jsx>{`
        @keyframes ap-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          background: "var(--ap-paper)",
          border: "1px solid var(--ap-line-2)",
          padding: "8px 10px",
          fontSize: 13,
          color: "var(--ap-ink)",
          fontFamily: "inherit",
          cursor: disabled ? "not-allowed" : "pointer",
          minWidth: 110,
        }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function HashtagGroup({
  label,
  tags,
  onAppend,
}: {
  label: string;
  tags: string[];
  onAppend: () => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-3)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {label} · {tags.length}
        </span>
        <button
          type="button"
          onClick={onAppend}
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-stamp)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          + Añadir
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              background: "var(--ap-paper)",
              border: "1px solid var(--ap-line)",
              padding: "4px 10px",
              fontSize: 12,
              color: "var(--ap-ink-2)",
              fontFamily: "var(--ap-font-mono)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function UsageBadge({
  usage,
  cacheRatio,
}: {
  usage: UsageInfo;
  cacheRatio: number;
}) {
  const cents = (usage.costUsd * 100).toFixed(2);
  return (
    <span
      title={`Modelo: ${usage.model} · in ${usage.inputTokens}/cache ${usage.cacheReadTokens}/out ${usage.outputTokens}`}
      className="ap-mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ap-ink-4)",
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{cents}¢</span>
      {cacheRatio > 0 && (
        <span style={{ color: "var(--ap-stamp)" }}>
          {cacheRatio}% cache
        </span>
      )}
    </span>
  );
}
