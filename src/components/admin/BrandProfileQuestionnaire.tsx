"use client";

/**
 * Onboarding questionnaire — sube el Brand DNA del Business de L1 (cold) a
 * L2 (onboarded · 70% calidad de output).
 *
 * 6 campos, 3-5 minutos:
 *   1. Tono (selector visual)
 *   2. Descripción de la marca (3 frases)
 *   3. Captions de ejemplo (3-5)
 *   4. URLs de imágenes representativas (3-10)
 *   5. Nicho (autocomplete)
 *   6. Frases tabú (opcional)
 *
 * Diseño:
 *   - Steps verticales en una sola página, no wizard de pasos (menos fricción).
 *   - "Guardar y completar luego" siempre disponible.
 *   - El nivel actual del Brand DNA visible al inicio.
 */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

const TONE_OPTIONS = [
  { key: "formal_editorial", label: "Editorial formal", sub: "Tono periodístico, frases pulidas" },
  { key: "casual_cercano", label: "Casual cercano", sub: "Como hablarle a un amigo" },
  { key: "irreverente", label: "Irreverente", sub: "Punzante, con personalidad" },
  { key: "premium_luxury", label: "Premium luxury", sub: "Sobrio, exclusivo, minimalista" },
  { key: "tecnico", label: "Técnico", sub: "Detallado, expert-to-expert" },
] as const;

const NICHE_OPTIONS = [
  "Gastronomía",
  "Moda",
  "Belleza",
  "Fitness y wellness",
  "Tecnología",
  "Agencia / Marketing",
  "Inmobiliaria",
  "Educación",
  "Arte y diseño",
  "Música",
  "Viajes",
  "Salud",
  "Empresa B2B",
  "Coaching",
  "E-commerce",
  "Otro",
];

interface Props {
  businessSlug: string;
  /** Optional: callback tras guardar exitosamente. */
  onSaved?: (level: string) => void;
}

interface Profile {
  level: string;
  bootstrapTone?: string;
  bootstrapDescription?: string;
  bootstrapExamples?: string[];
  bootstrapImages?: string[];
  bootstrapNiche?: string;
  bootstrapTaboos?: string[];
}

export function BrandProfileQuestionnaire({ businessSlug, onSaved }: Props) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [tone, setTone] = useState<string>("");
  const [description, setDescription] = useState("");
  const [examples, setExamples] = useState<string[]>(["", "", ""]);
  const [images, setImages] = useState<string[]>([""]);
  const [niche, setNiche] = useState("");
  const [taboosInput, setTaboosInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/businesses/${businessSlug}/brand-profile`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const p: Profile = data.profile;
        setProfile(p);
        if (p) {
          setTone(p.bootstrapTone ?? "");
          setDescription(p.bootstrapDescription ?? "");
          setExamples(
            (p.bootstrapExamples?.length ?? 0) >= 3
              ? p.bootstrapExamples!
              : [...(p.bootstrapExamples ?? []), ...Array(3 - (p.bootstrapExamples?.length ?? 0)).fill("")],
          );
          setImages(p.bootstrapImages?.length ? p.bootstrapImages : [""]);
          setNiche(p.bootstrapNiche ?? "");
          setTaboosInput((p.bootstrapTaboos ?? []).join(", "));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  function setExample(index: number, value: string) {
    setExamples((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addExample() {
    if (examples.length < 10) setExamples([...examples, ""]);
  }

  function removeExample(index: number) {
    setExamples(examples.filter((_, i) => i !== index));
  }

  function setImageUrl(index: number, value: string) {
    setImages((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function addImage() {
    if (images.length < 20) setImages([...images, ""]);
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const cleanExamples = examples
        .map((s) => s.trim())
        .filter((s) => s.length >= 10);
      const cleanImages = images
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//i.test(s));
      const cleanTaboos = taboosInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length >= 2);

      const res = await fetch(`/api/businesses/${businessSlug}/brand-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bootstrapTone: tone || undefined,
          bootstrapDescription: description.trim() || undefined,
          bootstrapExamples: cleanExamples.length > 0 ? cleanExamples : undefined,
          bootstrapImages: cleanImages.length > 0 ? cleanImages : undefined,
          bootstrapNiche: niche || undefined,
          bootstrapTaboos: cleanTaboos.length > 0 ? cleanTaboos : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "No se pudo guardar", "error");
        return;
      }
      setProfile(data.profile);
      toast(
        data.profile.level === "L2"
          ? "Brand DNA L2 activado · IA al 70% de calidad"
          : "Datos guardados",
        "success",
      );
      onSaved?.(data.profile.level);
    } catch {
      toast("Error de red", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="ap-mono"
        style={{
          padding: 16,
          fontSize: 11,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Cargando…
      </div>
    );
  }

  const currentLevel = profile?.level ?? "L1";
  const levelLabel: Record<string, { color: string; quality: string; subtitle: string }> = {
    L1: { color: "var(--ap-stamp)", quality: "50%", subtitle: "Genérica · sin entrenamiento" },
    L2: { color: "var(--ap-mustard, #D4A627)", quality: "70%", subtitle: "Bootstrap · usa tus respuestas" },
    L3: { color: "var(--ap-mustard, #D4A627)", quality: "80%", subtitle: "Lite · aprende de referencias" },
    L4: { color: "var(--ap-olive, #6B7A2E)", quality: "90%+", subtitle: "Trained · LoRA visual activo" },
    L5: { color: "var(--ap-olive, #6B7A2E)", quality: "95%+", subtitle: "Mature · feedback loop activo" },
  };
  const lvl = levelLabel[currentLevel] ?? levelLabel.L1;

  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "clamp(20px, 3vw, 32px)",
      }}
      aria-label="Brand DNA questionnaire"
    >
      {/* Header con nivel actual */}
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
            ✦ Brand DNA
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
            Entrena la IA en tu marca
          </h3>
          <p style={{ fontSize: 13, color: "var(--ap-ink-3)", margin: "8px 0 0", fontStyle: "italic" }}>
            Tres minutos ahora = IA al 70% de calidad desde la primera generación.
          </p>
        </div>

        <div
          style={{
            border: `1px solid ${lvl.color}`,
            padding: "8px 14px",
            textAlign: "center",
            minWidth: 160,
          }}
        >
          <p
            className="ap-mono"
            style={{
              fontSize: 9,
              color: lvl.color,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
              fontWeight: 600,
            }}
          >
            {currentLevel} · {lvl.quality}
          </p>
          <p style={{ fontSize: 10, color: "var(--ap-ink-4)", margin: "2px 0 0", fontStyle: "italic" }}>
            {lvl.subtitle}
          </p>
        </div>
      </header>

      <div style={{ display: "grid", gap: 24, marginTop: 20 }}>
        {/* 1. Tono */}
        <Section number="01" title="Tono de tu marca">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
            }}
          >
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTone(opt.key)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  background:
                    tone === opt.key ? "var(--ap-paper)" : "transparent",
                  border:
                    tone === opt.key
                      ? "2px solid var(--ap-stamp)"
                      : "1px solid var(--ap-line-2)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  color: "var(--ap-ink)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600, fontSize: 13 }}>{opt.label}</p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: "var(--ap-ink-3)",
                    fontStyle: "italic",
                  }}
                >
                  {opt.sub}
                </p>
              </button>
            ))}
          </div>
        </Section>

        {/* 2. Descripción */}
        <Section number="02" title="Describe tu marca en 2-3 frases">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Cafetería de especialidad en Madrid centro. Vibe industrial, foco en café de origen, brunch los fines de semana."
            style={inputStyle}
          />
          <p style={tinyHelp}>
            {description.length}/500 — sé específico: ubicación, vibe, productos clave.
          </p>
        </Section>

        {/* 3. Captions ejemplo */}
        <Section number="03" title="Captions que te gustan (3-5 ejemplos)">
          <p style={{ ...tinyHelp, marginBottom: 8 }}>
            Pega captions de tu cuenta o de referencias que admiras. La IA los analiza para
            aprender tu ritmo.
          </p>
          {examples.map((ex, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <textarea
                value={ex}
                onChange={(e) => setExample(i, e.target.value)}
                rows={2}
                maxLength={2200}
                placeholder={`Caption ${i + 1}…`}
                style={{ ...inputStyle, flex: 1 }}
              />
              {examples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExample(i)}
                  className="ap-mono"
                  style={removeBtnStyle}
                  aria-label={`Quitar ejemplo ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {examples.length < 10 && (
            <button
              type="button"
              onClick={addExample}
              className="ap-mono"
              style={addBtnStyle}
            >
              + Añadir ejemplo
            </button>
          )}
        </Section>

        {/* 4. Imágenes */}
        <Section number="04" title="Imágenes representativas (URLs)">
          <p style={{ ...tinyHelp, marginBottom: 8 }}>
            Pega 3-10 URLs de imágenes que representen tu estilo visual (Instagram, Pinterest,
            tu sitio web). Sprint 4 entrenará un LoRA visual con ellas.
          </p>
          {images.map((url, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setImageUrl(i, e.target.value)}
                placeholder="https://..."
                style={{ ...inputStyle, flex: 1 }}
              />
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="ap-mono"
                  style={removeBtnStyle}
                  aria-label={`Quitar imagen ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {images.length < 20 && (
            <button
              type="button"
              onClick={addImage}
              className="ap-mono"
              style={addBtnStyle}
            >
              + Añadir URL
            </button>
          )}
        </Section>

        {/* 5. Nicho */}
        <Section number="05" title="Tu nicho">
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            style={selectStyle}
          >
            <option value="">Selecciona…</option>
            {NICHE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Section>

        {/* 6. Tabús */}
        <Section number="06" title="Frases que NUNCA dirías (opcional)">
          <input
            type="text"
            value={taboosInput}
            onChange={(e) => setTaboosInput(e.target.value)}
            placeholder='imperdible, de locos, "click aquí"...'
            style={inputStyle}
          />
          <p style={tinyHelp}>Separadas por comas. La IA las evitará en sus generaciones.</p>
        </Section>

        {/* Save */}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ap-btn ap-btn--stamp"
            style={{
              padding: "12px 20px",
              fontSize: 13,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? "Guardando…" : "Guardar Brand DNA"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
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
          margin: "0 0 6px",
        }}
      >
        {number} · {title}
      </p>
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
  resize: "vertical",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const tinyHelp: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: 11,
  color: "var(--ap-ink-4)",
  fontStyle: "italic",
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
