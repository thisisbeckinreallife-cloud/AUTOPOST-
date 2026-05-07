"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/brand/cn";

/**
 * Hero — Fase 2 plan funcional.
 *
 * Estilo 21st.dev: centrado vertical, badge sparkle, headline gigante con
 * gradient en línea 2, sub centrado, dos CTAs, stats inline con dividers.
 *
 * Background: gradient mesh azul+violeta (radials blur), grid glow sutil,
 * grain texture.
 *
 * Stagger entrance via CSS animation-delay (no JS necesario para FOUC-free).
 */
export function Hero() {
  return (
    <section
      className={cn(
        "relative min-h-screen flex flex-col items-center justify-center",
        "pt-32 pb-20 px-6 text-center overflow-hidden"
      )}
    >
      {/* Background gradient mesh */}
      <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute rounded-full blur-[140px] opacity-[0.18]"
          style={{
            top: "-300px",
            left: "calc(50% - 450px)",
            width: "900px",
            height: "900px",
            background: "radial-gradient(circle, var(--pri) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute rounded-full blur-[140px] opacity-[0.12]"
          style={{
            bottom: "-400px",
            left: "calc(50% - 450px)",
            width: "900px",
            height: "900px",
            background: "radial-gradient(circle, var(--ai) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Grid glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,106,44,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,106,44,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      <div className="relative z-[2] w-full max-w-[880px] mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <div
          className={cn(
            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8",
            "bg-white/[0.04] border border-white/10 backdrop-blur-sm",
            "text-np-caption font-medium text-ink-7",
            "hover:border-ai/40 hover:bg-ai-soft hover:text-ink-9 transition-all",
            "np-anim-hero-fade"
          )}
          style={{ animationDelay: "0.1s" }}
        >
          <span aria-hidden="true" className="text-ai">✦</span>
          <span>Programación de redes con IA</span>
        </div>

        {/* Headline */}
        <h1
          className={cn(
            "font-np-sans font-bold text-ink-9 mb-6",
            "tracking-tight leading-[1.02]",
            "np-anim-hero-fade"
          )}
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5rem)",
            animationDelay: "0.25s",
          }}
        >
          <span>Tira la carpeta.</span>
          <br />
          <span
            className="inline-block"
            style={{
              background: "linear-gradient(135deg, var(--ink-9) 0%, var(--pri) 60%, var(--ai) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              paddingRight: "2px",
            }}
          >
            El resto va solo.
          </span>
        </h1>

        {/* Sub */}
        <p
          className={cn(
            "text-np-body-lg text-ink-7 mb-10 max-w-[640px]",
            "np-anim-hero-fade"
          )}
          style={{ animationDelay: "0.4s" }}
        >
          Sube una carpeta de posts. La IA detecta formato, sugiere hora y te monta el calendario. Tú apruebas.
        </p>

        {/* CTAs */}
        <div
          className="flex gap-3 flex-wrap justify-center mb-16 np-anim-hero-fade"
          style={{ animationDelay: "0.55s" }}
        >
          <Link
            href="/signup"
            className={cn(
              "inline-flex items-center justify-center h-[56px] px-6 gap-3 rounded-lg",
              "bg-pri text-ink-10 font-medium text-np-body",
              "shadow-[var(--np-shadow-sm),var(--np-glow-blue)]",
              "hover:bg-pri-dim hover:-translate-y-px",
              "transition-all duration-200 ease-[var(--np-ease-out)]"
            )}
          >
            <span>Comenzar gratis</span>
            <span aria-hidden="true">→</span>
          </Link>
          <a
            href="#how"
            className={cn(
              "inline-flex items-center justify-center h-[56px] px-6 gap-3 rounded-lg",
              "bg-transparent text-ink-8 border border-ink-3 font-medium text-np-body",
              "hover:border-ink-5 hover:bg-ink-1",
              "transition-all duration-200"
            )}
          >
            Ver cómo funciona
          </a>
        </div>

        {/* Stats inline */}
        <div
          className="flex items-center gap-8 flex-wrap justify-center np-anim-hero-fade"
          style={{ animationDelay: "0.7s" }}
        >
          <Stat value="12.4M+" label="posts publicados" />
          <span aria-hidden="true" className="hidden sm:block w-px h-8 bg-ink-3" />
          <Stat value="8.7s" label="carpeta procesada" />
          <span aria-hidden="true" className="hidden sm:block w-px h-8 bg-ink-3" />
          <Stat value="47" label="redes conectadas" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-np-sans font-semibold text-ink-9 leading-none" style={{ fontSize: "32px", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div className="font-np-mono text-np-caption text-ink-6 uppercase tracking-wider mt-2">
        {label}
      </div>
    </div>
  );
}
