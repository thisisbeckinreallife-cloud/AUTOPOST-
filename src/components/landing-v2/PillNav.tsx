"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/brand/cn";

interface NavLink {
  href: string;
  label: string;
}

const LINKS: NavLink[] = [
  { href: "#how", label: "Cómo funciona" },
  { href: "#features", label: "Características" },
  { href: "#pricing", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
];

/**
 * PillNav — Fase 2 plan funcional.
 *
 * Top-fixed nav con:
 *  - Logo izquierda
 *  - Pill central con cursor gradient sliding al hover
 *  - CTAs derecha (Entrar / Comenzar)
 *
 * Backdrop-blur translucent. Mobile: pill oculta, solo logo + CTAs.
 */
export function PillNav() {
  const [cursor, setCursor] = React.useState({ left: 0, width: 0, opacity: 0 });
  const pillRef = React.useRef<HTMLUListElement>(null);

  function moveCursor(li: HTMLLIElement) {
    const rect = li.getBoundingClientRect();
    const parentRect = pillRef.current?.getBoundingClientRect();
    if (!parentRect) return;
    setCursor({
      left: li.offsetLeft,
      width: rect.width,
      opacity: 1,
    });
  }

  function hideCursor() {
    setCursor((prev) => ({ ...prev, opacity: 0 }));
  }

  return (
    <header
      role="banner"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16",
        "backdrop-blur-md bg-ink-0/70 border-b border-ink-3/50"
      )}
    >
      <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" aria-label="Autopost — inicio" className="flex items-center gap-2">
          <span aria-hidden="true" className="relative w-6 h-6 rounded bg-pri">
            <span className="absolute inset-[5px] bg-ink-0 rounded-sm" />
          </span>
          <span className="font-np-mono text-np-body font-semibold text-ink-9 tracking-tight">
            autopost<span className="text-pri">.</span>
          </span>
        </Link>

        {/* Pill nav (desktop only) */}
        <ul
          ref={pillRef}
          onMouseLeave={hideCursor}
          className={cn(
            "hidden md:flex relative items-center p-1 gap-1",
            "border border-ink-3 rounded-full bg-ink-1/60 backdrop-blur-sm"
          )}
        >
          {LINKS.map((link) => (
            <PillItem key={link.href} link={link} onEnter={moveCursor} />
          ))}
          <li
            aria-hidden="true"
            className={cn(
              "absolute z-0 top-1 bottom-1 left-0 rounded-full pointer-events-none",
              "bg-gradient-to-br from-pri to-ai shadow-[var(--np-glow-blue)]"
            )}
            style={{
              left: `${cursor.left}px`,
              width: `${cursor.width}px`,
              opacity: cursor.opacity,
              transition:
                "left 280ms cubic-bezier(0.16,1,0.3,1), width 280ms cubic-bezier(0.16,1,0.3,1), opacity 200ms cubic-bezier(0.65,0,0.35,1)",
            }}
          />
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              "hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-lg",
              "text-np-caption text-ink-8 hover:text-ink-9 hover:bg-ink-1",
              "border border-transparent hover:border-ink-3",
              "transition-all"
            )}
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className={cn(
              "inline-flex items-center justify-center h-10 px-4 rounded-lg",
              "bg-pri text-ink-10 font-medium text-np-caption",
              "shadow-[var(--np-shadow-sm),var(--np-glow-blue)]",
              "hover:bg-pri-dim hover:-translate-y-px",
              "transition-all duration-200"
            )}
          >
            Comenzar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}

function PillItem({
  link,
  onEnter,
}: {
  link: NavLink;
  onEnter: (li: HTMLLIElement) => void;
}) {
  const ref = React.useRef<HTMLLIElement>(null);
  return (
    <li
      ref={ref}
      onMouseEnter={() => ref.current && onEnter(ref.current)}
      className="relative z-10"
    >
      <a
        href={link.href}
        className="block px-4 py-2 text-np-caption font-medium text-ink-7 uppercase tracking-wider hover:text-ink-10 transition-colors mix-blend-difference"
      >
        {link.label}
      </a>
    </li>
  );
}
