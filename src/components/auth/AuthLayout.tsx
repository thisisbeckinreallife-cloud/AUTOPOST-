"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/components/brand/cn";

export interface AuthLayoutProps {
  /** Página visible activa (afecta el helper de cambio en footer) */
  page?: "login" | "signup" | "forgot" | "reset" | "verify";
  children: React.ReactNode;
  /** Texto en el botón "← Volver" del control bar */
  backHref?: string;
  backLabel?: string;
}

/**
 * AuthLayout — wrapper visual común a /login, /signup, /forgot-password,
 * /reset-password, /verify-email.
 *
 * Background: gradient mesh azul+violeta sutil + grid glow + grain.
 * Card centrada max-w 440px con borde sutil ink-3.
 * Brand mark + wordmark "autopost." arriba.
 *
 * Bilingüe: lee NextIntlClientProvider del layout (auth)/layout.tsx.
 */
export function AuthLayout({
  page = "login",
  children,
  backHref = "/",
  backLabel = "← Volver",
}: AuthLayoutProps) {
  return (
    <div className="np-root min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background mesh — azul + violeta blur */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute rounded-full blur-[140px] opacity-[0.18]"
          style={{
            top: "-300px",
            left: "calc(50% - 600px)",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, var(--pri) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[140px] opacity-[0.12]"
          style={{
            bottom: "-400px",
            left: "calc(50% + 100px)",
            width: "800px",
            height: "800px",
            background: "radial-gradient(circle, var(--ai) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Grid glow */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(79, 124, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 124, 255, 0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      <main className="relative z-[2] w-full max-w-[440px] px-6">
        <div
          className={cn(
            "bg-ink-1 border border-ink-3 rounded-2xl",
            "px-8 py-10 relative overflow-hidden"
          )}
        >
          {/* Top hairline gradient */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, var(--pri), transparent)",
              opacity: 0.4,
            }}
          />

          <Link
            href="/"
            aria-label="Autopost — volver al inicio"
            className="inline-flex items-center gap-2 mb-8 group w-fit"
          >
            <span
              aria-hidden="true"
              className="relative w-7 h-7 rounded-md bg-pri shadow-[var(--np-glow-blue)]"
            >
              <span className="absolute inset-[6px] bg-ink-1 rounded-sm" />
            </span>
            <span className="font-np-mono text-np-h4 font-semibold text-ink-9 tracking-tight">
              autopost<span className="text-pri">.</span>
            </span>
          </Link>

          {children}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={backHref}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-8",
              "border border-ink-3 rounded-md bg-ink-1/50 backdrop-blur-md",
              "text-np-caption text-ink-7 hover:text-ink-9 hover:border-ink-5",
              "transition-colors"
            )}
          >
            {backLabel}
          </Link>
        </div>
      </main>
    </div>
  );
}
