"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StepShell } from "@/components/onboarding/StepShell";
import { Button } from "@/components/brand/Button";
import { cn } from "@/components/brand/cn";

type Phase = "idle" | "uploading" | "processing" | "done";

const PROCESSING_STEPS = [
  "Subiendo archivos…",
  "La IA está leyendo cada uno…",
  "Detectando formato y red…",
  "Calculando mejor hora…",
  "Generando textos en tu tono…",
];

export default function OnboardingStep3() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [stepIdx, setStepIdx] = React.useState(0);
  const [filesCount, setFilesCount] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (phase !== "processing") return;
    const interval = window.setInterval(() => {
      setStepIdx((i) => {
        if (i >= PROCESSING_STEPS.length - 1) {
          window.clearInterval(interval);
          // Tras terminar la última, avanzar a "done"
          window.setTimeout(() => setPhase("done"), 800);
          return i;
        }
        return i + 1;
      });
    }, 1400);
    return () => window.clearInterval(interval);
  }, [phase]);

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFilesCount(files.length);
    setPhase("uploading");
    // Mock: no upload real en onboarding (el flow real lo hace el dashboard).
    // Solo simulamos el feel para que el usuario vea el progreso visual.
    window.setTimeout(() => {
      setPhase("processing");
      setStepIdx(0);
    }, 800);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  }

  async function next() {
    try {
      await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 4 }),
      });
    } catch {
      // continuar igual
    }
    router.push("/onboarding/4");
  }

  function skip() {
    if (confirm("¿Saltar la guía? Podrás subir tu carpeta después desde el panel.")) {
      void fetch("/api/onboarding/complete", { method: "POST" }).then(() => router.push("/dashboard"));
    }
  }

  return (
    <StepShell
      step={3}
      title="Sube tu primera carpeta"
      sub="La IA leerá cada archivo y te montará el calendario. Cualquier cosa vale: vídeos, imágenes, textos."
      onSkip={skip}
      backHref="/onboarding/2"
    >
      {phase === "idle" || phase === "uploading" ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
            "bg-ink-1 hover:bg-pri-soft hover:border-pri",
            phase === "uploading" ? "border-pri bg-pri-soft" : "border-ink-3"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
            accept="image/*,video/*,.zip,.txt,.pdf"
          />
          <div className="text-5xl mb-3" aria-hidden="true">
            {phase === "uploading" ? "⏳" : "📁"}
          </div>
          {phase === "uploading" ? (
            <>
              <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-2">
                Subiendo {filesCount} archivos…
              </h3>
              <p className="text-np-body text-ink-7">Un momento.</p>
            </>
          ) : (
            <>
              <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-2">
                Arrastra una carpeta aquí
              </h3>
              <p className="text-np-body text-ink-7 mb-4">
                O haz click para elegir desde tu ordenador.
              </p>
              <p className="font-np-mono text-np-caption text-ink-6">
                Suele tardar 8 segundos para 30-50 archivos.
              </p>
            </>
          )}
        </div>
      ) : null}

      {phase === "processing" ? (
        <div className="bg-ink-1 border border-ink-3 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden="true" className="w-3 h-3 rounded-full bg-ai animate-pulse" />
            <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9">
              La IA está leyendo tus archivos
            </h3>
          </div>
          <ul className="flex flex-col gap-3">
            {PROCESSING_STEPS.map((step, i) => (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-3 transition-all",
                  i < stepIdx && "text-[color:var(--np-success)]",
                  i === stepIdx && "text-ink-9 font-medium",
                  i > stepIdx && "text-ink-6"
                )}
              >
                <span aria-hidden="true" className="w-5 inline-flex items-center justify-center">
                  {i < stepIdx ? "✓" : i === stepIdx ? <span className="inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : "·"}
                </span>
                <span className="text-np-body">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="bg-[color:var(--np-success-soft)] border border-[color:var(--np-success)]/40 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3" aria-hidden="true">✓</div>
          <h3 className="font-np-sans text-np-h3 font-semibold text-[color:var(--np-success)] mb-2">
            ¡Listo! Carpeta procesada
          </h3>
          <p className="text-np-body text-ink-7 mb-6">
            La IA detectó <strong className="text-ink-9">{filesCount || 12} publicaciones</strong> en {Math.max(8, Math.floor(filesCount / 4))} segundos. Veamos cómo quedan.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={next}>
            Ver el calendario
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      ) : null}
    </StepShell>
  );
}
