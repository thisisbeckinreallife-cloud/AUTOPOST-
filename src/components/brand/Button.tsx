"use client";

import * as React from "react";
import { cn } from "./cn";

type Variant = "primary" | "ghost" | "ai" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
  fullWidth?: boolean;
}

/**
 * Button — rebrand v1.
 *
 * Touch target mín 48px en md (np-touch), 56px en lg (np-touch-lg).
 * Variantes:
 *   - primary: azul brand, glow azul, hover dim
 *   - ghost:   borderless transparente con borde 1px ink-3
 *   - ai:      violeta IA — RESERVADO para acciones IA explícitas
 *   - danger:  rojo error
 *
 * Loading: spinner inline, deshabilita botón, aria-busy.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) {
    const sizeClass =
      size === "sm"
        ? "h-10 px-4 text-np-caption gap-2"
        : size === "lg"
        ? "h-[56px] px-6 text-np-body gap-3"
        : "h-12 px-5 text-np-body gap-2";

    const variantClass =
      variant === "primary"
        ? "bg-pri text-ink-10 shadow-[var(--np-shadow-sm),var(--np-glow-blue)] hover:bg-pri-dim hover:-translate-y-px"
        : variant === "ai"
        ? "bg-transparent text-ai border border-ai hover:bg-ai-soft hover:shadow-[var(--np-glow-violet)]"
        : variant === "danger"
        ? "bg-transparent text-[color:var(--np-error)] border border-[color:var(--np-error)] hover:bg-[color:var(--np-error-soft)]"
        : /* ghost */
          "bg-transparent text-ink-8 border border-ink-3 hover:border-ink-5 hover:bg-ink-1";

    const disabledClass = (disabled || loading)
      ? "opacity-60 pointer-events-none"
      : "active:translate-y-0";

    return (
      <button
        ref={ref}
        type={type}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium",
          "font-np-sans",
          "transition-all duration-200 ease-[var(--np-ease-out)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pri",
          "select-none whitespace-nowrap",
          fullWidth && "w-full",
          sizeClass,
          variantClass,
          disabledClass,
          className
        )}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        ) : null}
        {children}
      </button>
    );
  }
);
