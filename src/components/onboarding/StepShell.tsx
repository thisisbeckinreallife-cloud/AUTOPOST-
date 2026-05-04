"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/brand/cn";
import { ProgressBar } from "./ProgressBar";

export interface StepShellProps {
  step: number;
  title: string;
  sub: string;
  children: React.ReactNode;
  /** Botón "Saltar al panel" arriba derecha (solo visible si onSkip) */
  onSkip?: () => void;
  /** "Volver al paso anterior" abajo izquierda */
  backHref?: string;
}

/**
 * StepShell — wrapper de cada paso del wizard onboarding.
 *
 * Estructura:
 *   - Header con logo + ProgressBar + botón "Saltar"
 *   - Card centrada con título + sub + contenido
 *   - Footer con "← Atrás" si aplica
 *
 * El bg sigue el tema brand: gradient mesh sutil + grid glow.
 */
export function StepShell({
  step,
  title,
  sub,
  children,
  onSkip,
  backHref,
}: StepShellProps) {
  return (
    <div className="np-root min-h-screen bg-ink-0 flex flex-col relative overflow-hidden">
      {/* Background mesh */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute rounded-full blur-[140px] opacity-[0.15]"
          style={{
            top: "-300px",
            left: "calc(50% - 450px)",
            width: "900px",
            height: "900px",
            background: "radial-gradient(circle, var(--pri) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between">
        <Link href="/" aria-label="Autopost — inicio" className="flex items-center gap-2">
          <span aria-hidden="true" className="relative w-7 h-7 rounded-md bg-pri">
            <span className="absolute inset-[6px] bg-ink-0 rounded-sm" />
          </span>
          <span className="font-np-mono text-np-body font-semibold text-ink-9 tracking-tight">
            autopost<span className="text-pri">.</span>
          </span>
        </Link>

        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className={cn(
              "text-np-caption text-ink-7 hover:text-ink-9",
              "px-3 py-2 rounded-md hover:bg-ink-1 transition-colors"
            )}
          >
            Saltar al panel →
          </button>
        ) : null}
      </header>

      {/* Progress */}
      <div className="relative z-10 px-6 mb-8">
        <ProgressBar current={step} />
      </div>

      {/* Body */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-6 pb-16">
        <div className="w-full max-w-xl">
          <h1 className="font-np-sans text-np-h1 font-bold text-ink-9 mb-3 tracking-tight">
            {title}
          </h1>
          <p className="text-np-body-lg text-ink-7 mb-8">{sub}</p>

          {children}

          {backHref ? (
            <div className="mt-8 flex justify-start">
              <Link
                href={backHref}
                className="text-np-caption text-ink-6 hover:text-ink-8 transition-colors"
              >
                ← Atrás
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
