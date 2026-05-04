"use client";

import * as React from "react";
import { cn } from "./cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Estado semántico — afecta color y dot */
  status?: "connected" | "warning" | "expired" | "draft" | "scheduled" | "published" | "ai-suggested";
}

const STATUS_LABELS: Record<NonNullable<BadgeProps["status"]>, string> = {
  connected: "Conectado",
  warning: "Aviso",
  expired: "Expirado",
  draft: "Borrador",
  scheduled: "Programado",
  published: "Publicado",
  "ai-suggested": "Sugerencia IA",
};

/**
 * Badge — rebrand v1.
 * Indicador de estado más prominente que Pill. Usado en cards de conexión,
 * cabecera de posts, headers de modal.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { status = "connected", className, children, ...rest },
  ref
) {
  const variantClass =
    status === "connected" || status === "published"
      ? "bg-[color:var(--np-success-soft)] text-[color:var(--np-success)] border-[color:var(--np-success)]/40"
      : status === "warning" || status === "expired"
      ? "bg-[color:var(--np-warning-soft)] text-[color:var(--np-warning)] border-[color:var(--np-warning)]/40"
      : status === "draft"
      ? "bg-ink-2 text-ink-7 border-ink-4"
      : status === "scheduled"
      ? "bg-pri-soft text-pri border-pri/40"
      : /* ai-suggested */
        "bg-ai-soft text-ai border-ai/40";

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 px-3 h-8 rounded-full",
        "border text-np-caption font-medium font-np-sans tracking-wide",
        variantClass,
        className
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block w-1.5 h-1.5 rounded-full bg-current",
          (status === "ai-suggested" || status === "scheduled" || status === "warning") && "animate-pulse"
        )}
      />
      {children ?? STATUS_LABELS[status]}
    </span>
  );
});
