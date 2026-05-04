"use client";

import * as React from "react";
import { cn } from "./cn";

export interface TooltipProps {
  /** El contenido en español plano que explica el término técnico */
  children: React.ReactNode;
  /** El elemento sobre el que aparece el tooltip — default: ⓘ */
  trigger?: React.ReactNode;
  /** Posición del tooltip — default: bottom */
  side?: "top" | "bottom" | "left" | "right";
  /** Ancho máx del tooltip — default 240px */
  maxWidth?: number;
}

/**
 * Tooltip — rebrand v1.
 * Tooltip contextual con hover/focus accesible (no requiere click).
 * Patrón: [palabra técnica] <Tooltip>explicación plana</Tooltip>.
 * El trigger por defecto es un icono ⓘ que es clickable+focusable.
 */
export function Tooltip({
  children,
  trigger,
  side = "bottom",
  maxWidth = 240,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  const sideClass =
    side === "top"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : side === "left"
      ? "right-full mr-2 top-1/2 -translate-y-1/2"
      : side === "right"
      ? "left-full ml-2 top-1/2 -translate-y-1/2"
      : /* bottom */
        "top-full mt-2 left-1/2 -translate-x-1/2";

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        aria-label="Más información"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex items-center justify-center",
          "w-5 h-5 rounded-full text-[12px] font-bold",
          "bg-ink-2 text-ink-6 border border-ink-3",
          "hover:bg-ink-3 hover:text-ink-9 hover:border-ink-4",
          "focus:outline-2 focus:outline-offset-2 focus:outline-pri",
          "cursor-help select-none transition-colors duration-150"
        )}
      >
        {trigger ?? "ⓘ"}
      </button>

      {open ? (
        <span
          id={id}
          role="tooltip"
          style={{ maxWidth }}
          className={cn(
            "absolute z-50 px-3 py-2 rounded-md",
            "bg-ink-2 text-ink-9 text-np-caption font-np-sans",
            "border border-ink-4 shadow-[var(--np-shadow-lg)]",
            "whitespace-normal pointer-events-none",
            sideClass
          )}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
