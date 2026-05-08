"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
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
 * PillNav — top-fixed nav.
 *
 * Desktop ≥ md: pill central con cursor naranja sliding al hover + CTAs derecha.
 * Mobile < md: logo + hamburger drawer + CTA "Empezar". Drawer abre desde
 *   el lateral con focus trap básico (Esc cierra, click fuera cierra).
 */
export function PillNav() {
  const [cursor, setCursor] = React.useState({ left: 0, width: 0, opacity: 0 });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pillRef = React.useRef<HTMLUListElement>(null);

  function moveCursor(li: HTMLLIElement) {
    const parentRect = pillRef.current?.getBoundingClientRect();
    if (!parentRect) return;
    setCursor({
      left: li.offsetLeft,
      width: li.getBoundingClientRect().width,
      opacity: 1,
    });
  }

  function hideCursor() {
    setCursor((prev) => ({ ...prev, opacity: 0 }));
  }

  // Cierra el drawer al pulsar Esc o cambiar a desktop.
  React.useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    function onResize() {
      if (window.innerWidth >= 768) setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    // Bloquear scroll del body mientras el drawer está abierto.
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

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
          <span aria-hidden="true" className="relative w-6 h-6 rounded bg-accent">
            <span className="absolute inset-[5px] bg-ink-0 rounded-sm" />
          </span>
          <span className="font-np-mono text-np-body font-semibold text-ink-9 tracking-tight">
            autopost<span className="text-accent">.</span>
          </span>
        </Link>

        {/* Pill nav (desktop ≥ md) — landmark <nav> */}
        <nav aria-label="Principal" className="hidden md:block">
          <ul
            ref={pillRef}
            onMouseLeave={hideCursor}
            className={cn(
              "flex relative items-center p-1 gap-1",
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
                "bg-accent shadow-md"
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
        </nav>

        {/* Right actions (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              "inline-flex items-center justify-center h-10 px-4 rounded-md",
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
              "inline-flex items-center justify-center h-10 px-4 rounded-md",
              "bg-accent text-ink-0 font-medium text-np-caption",
              "shadow-md hover:bg-accent-hover hover:-translate-y-px",
              "transition-all duration-200"
            )}
          >
            Empezar 7 días gratis
          </Link>
        </div>

        {/* Mobile actions: hamburger + CTA compacto */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/signup"
            className={cn(
              "inline-flex items-center justify-center h-10 px-3 rounded-md",
              "bg-accent text-ink-0 font-medium text-xs",
              "hover:bg-accent-hover transition-colors"
            )}
          >
            Probar gratis
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className={cn(
              "h-10 w-10 inline-flex items-center justify-center rounded-md",
              "text-ink-8 hover:text-ink-9 hover:bg-ink-1 border border-ink-3",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring transition-colors"
            )}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <MobileDrawer onClose={() => setMobileOpen(false)} />
      ) : null}
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
        className="block px-4 py-2 text-np-caption font-medium text-ink-7 uppercase tracking-wider hover:text-ink-10 focus-visible:text-ink-9 transition-colors mix-blend-difference"
      >
        {link.label}
      </a>
    </li>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);

  // Mueve foco al botón cerrar al abrir.
  React.useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  return (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menú de navegación"
      className="fixed inset-0 z-50 md:hidden"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-ink-0/80 backdrop-blur-sm animate-fade-in"
      />

      {/* Panel */}
      <div className="absolute top-0 right-0 bottom-0 w-[88%] max-w-[340px] bg-ink-1 border-l border-ink-3 shadow-xl animate-slide-up flex flex-col">
        <div className="flex items-center justify-between px-6 h-16 border-b border-ink-3">
          <span className="font-np-mono text-np-body font-semibold text-ink-9">
            Menú
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className={cn(
              "h-10 w-10 inline-flex items-center justify-center rounded-md",
              "text-ink-8 hover:text-ink-9 hover:bg-ink-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring transition-colors"
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Principal mobile" className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "block w-full px-4 py-3 -mx-4 rounded-md",
                    "text-base font-medium text-ink-9 hover:bg-ink-2",
                    "focus-visible:outline-none focus-visible:bg-ink-2 transition-colors"
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-6 border-t border-ink-3 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={onClose}
              className={cn(
                "inline-flex items-center justify-center h-12 px-4 rounded-md",
                "border border-ink-3 text-ink-9 font-medium text-sm",
                "hover:bg-ink-2 transition-colors"
              )}
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              onClick={onClose}
              className={cn(
                "inline-flex items-center justify-center h-12 px-4 rounded-md",
                "bg-accent text-ink-0 font-medium text-sm shadow-md",
                "hover:bg-accent-hover transition-colors"
              )}
            >
              Empezar 7 días gratis
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
