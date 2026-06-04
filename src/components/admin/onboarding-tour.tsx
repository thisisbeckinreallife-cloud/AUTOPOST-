"use client";

import { useEffect, useState } from "react";
import { X, Zap, Instagram, Upload, CheckCircle, ArrowRight } from "lucide-react";

const TOUR_KEY = "autopost-tour-v1";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: TourStep[] = [
  {
    icon: <Zap className="h-6 w-6 text-accent-strong" />,
    title: "Bienvenido a Aluminum Studio",
    description:
      "Programa un mes entero de posts en Instagram en menos de 2 minutos. Te guiamos paso a paso para que estés publicando hoy mismo.",
  },
  {
    icon: <Instagram className="h-6 w-6 text-accent-strong" />,
    title: "Conecta tu Instagram",
    description:
      "Ve a «Mis cuentas» y añade tu cuenta. Solo necesitas una cuenta profesional (empresa o creador) y una página de Facebook vinculada.",
  },
  {
    icon: <Upload className="h-6 w-6 text-accent-strong" />,
    title: "Sube tu primera carpeta",
    description:
      "Desde la cuenta conectada, haz clic en «Subir contenido». Arrastra un ZIP con tus imágenes, vídeos y captions — Aluminum Studio lo organiza todo solo.",
  },
  {
    icon: <CheckCircle className="h-6 w-6 text-accent-strong" />,
    title: "Revisa y activa",
    description:
      "Confirma los posts detectados y actívalos con un clic. Aluminum Studio se encargará de publicarlos en el momento exacto que hayas configurado.",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done) setVisible(true);
    } catch {
      // localStorage not available (SSR safety)
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    if (visible) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  function dismiss() {
    try { localStorage.setItem(TOUR_KEY, "done"); } catch { /* ignore */ }
    setVisible(false);
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tour paso ${step + 1} de ${steps.length}`}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm animate-scale-in"
      >
        <div className="rounded-2xl border border-ink-4 bg-ink-2 shadow-lg overflow-hidden">
          {/* Progress bar */}
          <div className="h-0.5 bg-ink-2/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-strong transition-all duration-400"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-soft to-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                {current.icon}
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="p-1.5 rounded-lg text-ink-7 hover:text-ink-7 hover:bg-ink-2/[0.04] transition-colors"
                aria-label="Omitir tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <p className="text-xs text-accent-strong font-semibold">
                Paso {step + 1} de {steps.length}
              </p>
              <h2 className="font-display font-bold text-ink-9 text-lg leading-tight">
                {current.title}
              </h2>
              <p className="text-sm text-ink-6 leading-relaxed">
                {current.description}
              </p>
            </div>

            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-4 bg-accent"
                      : i < step
                      ? "w-1.5 bg-accent-soft"
                      : "w-1.5 bg-ink-2/[0.06]"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={dismiss}
                className="text-sm text-ink-7 hover:text-ink-6 transition-colors px-3 py-2"
              >
                Omitir
              </button>
              <button
                type="button"
                onClick={next}
                className="flex-1 flex items-center justify-center gap-2 bg-accent text-ink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
              >
                {isLast ? "¡Empezar!" : "Siguiente"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
