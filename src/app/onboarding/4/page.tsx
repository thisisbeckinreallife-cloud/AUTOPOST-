"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/onboarding/StepShell";
import { Button } from "@/components/brand/Button";
import { Pill } from "@/components/brand/Pill";
import { cn } from "@/components/brand/cn";

interface Suggestion {
  id: string;
  title: string;
  network: string;
  networkColor: string;
  when: string;
  preview: string;
  ai: boolean;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",
    title: "Reel — Presentación de tu marca",
    network: "Instagram",
    networkColor: "#E4405F",
    when: "Mañana · 09:00",
    preview: "Hola 👋 Soy María y te enseño cómo nació nuestra marca.",
    ai: true,
  },
  {
    id: "s2",
    title: "Carrusel — 3 razones para elegirnos",
    network: "Instagram",
    networkColor: "#E4405F",
    when: "Mañana · 14:30",
    preview: "Si dudas si te conviene, mira estas 3 cosas que nos diferencian.",
    ai: true,
  },
  {
    id: "s3",
    title: "Story — Detrás de cámara",
    network: "Instagram",
    networkColor: "#E4405F",
    when: "Pasado mañana · 12:00",
    preview: "Así organizamos un día normal en el equipo.",
    ai: false,
  },
  {
    id: "s4",
    title: "Post — Caso de éxito",
    network: "LinkedIn",
    networkColor: "#0A66C2",
    when: "Jueves · 09:00",
    preview: "Hablamos de cómo ayudamos a [cliente] a crecer un 40%…",
    ai: true,
  },
  {
    id: "s5",
    title: "Vídeo corto — Tip rápido",
    network: "TikTok",
    networkColor: "#FF0050",
    when: "Viernes · 17:00",
    preview: "El error que la mayoría comete y cómo evitarlo.",
    ai: false,
  },
];

export default function OnboardingStep4() {
  const router = useRouter();
  const [approved, setApproved] = React.useState<Set<string>>(new Set(SUGGESTIONS.map((s) => s.id)));
  const [loading, setLoading] = React.useState(false);

  function toggle(id: string) {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function approveAll() {
    setLoading(true);
    try {
      await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 5 }),
      });
      router.push("/onboarding/5");
    } catch {
      setLoading(false);
    }
  }

  function skip() {
    if (confirm("¿Saltar la guía? Podrás revisar el calendario después desde el panel.")) {
      void fetch("/api/onboarding/complete", { method: "POST" }).then(() => router.push("/dashboard"));
    }
  }

  return (
    <StepShell
      step={4}
      title="Revisa tu calendario"
      sub={`La IA preparó ${SUGGESTIONS.length} publicaciones a partir de tu carpeta. Quita las que no quieras y aprueba el resto.`}
      onSkip={skip}
      backHref="/onboarding/3"
    >
      <div className="flex flex-col gap-3 mb-6">
        {SUGGESTIONS.map((s) => (
          <SuggestionCard key={s.id} s={s} approved={approved.has(s.id)} onToggle={() => toggle(s.id)} />
        ))}
      </div>

      <div className="bg-ink-1 border border-ink-3 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="font-np-sans text-np-h4 text-ink-9 font-semibold flex-1">
          {approved.size} de {SUGGESTIONS.length} listas para publicar
        </span>
        <span className="font-np-mono text-np-caption text-ink-6">
          Las puedes editar después
        </span>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        onClick={approveAll}
        disabled={approved.size === 0}
      >
        Aprobar las {approved.size} publicaciones
        <span aria-hidden="true">→</span>
      </Button>
    </StepShell>
  );
}

function SuggestionCard({
  s,
  approved,
  onToggle,
}: {
  s: Suggestion;
  approved: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={cn(
        "bg-ink-1 border rounded-xl p-5 transition-all",
        approved ? "border-pri shadow-[var(--np-shadow-sm)]" : "border-ink-3 opacity-50"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-md flex-shrink-0 flex items-center justify-center text-ink-10 font-bold"
          style={{ background: s.networkColor }}
        >
          {s.network.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="font-np-sans text-np-h4 text-ink-9 font-medium">{s.title}</span>
            {s.ai ? <Pill variant="ai" size="sm">IA</Pill> : null}
          </div>
          <p className="text-np-body text-ink-7 mb-3 line-clamp-2">{s.preview}</p>
          <div className="font-np-mono text-np-caption text-ink-6 uppercase tracking-wider">
            {s.network} · {s.when}
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-pressed={approved}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all",
            approved
              ? "bg-pri text-ink-10 shadow-[var(--np-glow-blue)]"
              : "bg-ink-2 text-ink-6 hover:bg-ink-3"
          )}
          aria-label={approved ? "Quitar publicación" : "Aprobar publicación"}
        >
          {approved ? "✓" : "+"}
        </button>
      </div>
    </article>
  );
}
