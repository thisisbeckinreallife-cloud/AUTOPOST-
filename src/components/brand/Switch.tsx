"use client";

import * as React from "react";
import { cn } from "./cn";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  /** label del estado off (opcional, lectores screen reader) */
  ariaLabelOff?: string;
  /** label del estado on (opcional) */
  ariaLabelOn?: string;
}

/**
 * Switch — rebrand v1.
 * Toggle on/off accesible (rol switch + aria-checked).
 * Tamaño 56×30px (touch target conforme).
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    onCheckedChange,
    label,
    ariaLabelOn = "Activado",
    ariaLabelOff = "Desactivado",
    className,
    disabled,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || (checked ? ariaLabelOn : ariaLabelOff)}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center",
        "w-14 h-8 rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-[var(--np-ease-out)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pri",
        checked
          ? "bg-pri shadow-[var(--np-glow-blue)]"
          : "bg-ink-3",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-6 w-6 rounded-full bg-ink-9",
          "transform ring-0 transition-transform duration-200 ease-[var(--np-ease-back)]",
          "shadow-md",
          checked ? "translate-x-6 bg-ink-10" : "translate-x-0.5"
        )}
      />
    </button>
  );
});
