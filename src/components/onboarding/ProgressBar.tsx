import * as React from "react";
import { cn } from "@/components/brand/cn";

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  "Tu negocio",
  "Tu primera red",
  "Tu primera carpeta",
  "Tu calendario",
  "¡Listo!",
];

/**
 * ProgressBar — wizard de onboarding (Fase 3).
 *
 * Muestra paso N de 5 + barra horizontal con dots por step.
 * Pasos completados en color primary, actual con glow azul,
 * pendientes en ink-3.
 */
export function ProgressBar({ current }: { current: number }) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="font-np-mono text-np-caption text-ink-7 tracking-wider uppercase">
          Paso {current} de {TOTAL_STEPS}
        </span>
        <span className="font-np-mono text-np-caption text-ink-6">
          {STEP_LABELS[current - 1]}
        </span>
      </div>

      <div className="flex items-center gap-2" aria-label="Progreso del registro">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isCurrent = stepNum === current;
          return (
            <div
              key={stepNum}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                isCurrent && "bg-pri shadow-[var(--np-glow-blue)]",
                isDone && "bg-pri",
                !isDone && !isCurrent && "bg-ink-3"
              )}
              aria-current={isCurrent ? "step" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
