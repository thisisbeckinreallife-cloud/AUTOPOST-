"use client";

import * as React from "react";
import { cn } from "./cn";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "ai" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  /** Si true, añade un dot de estado a la izquierda */
  dot?: boolean;
}

/**
 * Pill — rebrand v1.
 * Chip pequeño para estados, plataformas, hashtags, badges.
 * Variant "ai" reservada para outputs IA (siempre con sparkle ✦ implícito).
 */
export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { variant = "neutral", size = "md", dot, className, children, ...rest },
  ref
) {
  const sizeClass =
    size === "sm" ? "h-6 px-2 text-[11px]" : "h-7 px-3 text-np-caption";

  const variantClass =
    variant === "ai"
      ? "bg-ai-soft text-ai border border-ai/40"
      : variant === "success"
      ? "bg-[color:var(--np-success-soft)] text-[color:var(--np-success)] border border-[color:var(--np-success)]/40"
      : variant === "warning"
      ? "bg-[color:var(--np-warning-soft)] text-[color:var(--np-warning)] border border-[color:var(--np-warning)]/40"
      : variant === "error"
      ? "bg-[color:var(--np-error-soft)] text-[color:var(--np-error)] border border-[color:var(--np-error)]/40"
      : variant === "info"
      ? "bg-[color:var(--np-info-soft)] text-[color:var(--np-info)] border border-[color:var(--np-info)]/40"
      : "bg-ink-2 text-ink-7 border border-ink-3";

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-np-mono font-medium whitespace-nowrap",
        "tracking-wider",
        sizeClass,
        variantClass,
        className
      )}
      {...rest}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="inline-block w-1.5 h-1.5 rounded-full bg-current"
        />
      ) : null}
      {variant === "ai" && !dot ? (
        <span aria-hidden="true" className="text-current">
          ✦
        </span>
      ) : null}
      {children}
    </span>
  );
});
