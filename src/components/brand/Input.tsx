"use client";

import * as React from "react";
import { cn } from "./cn";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  trailing?: React.ReactNode;
  leading?: React.ReactNode;
  /** Pasa true si el campo es para datos sensibles (password, token) — añade autocomplete adecuado por defecto */
}

/**
 * Input — rebrand v1.
 *
 * Altura mín 48px (touch target).
 * Errores SIEMPRE en español plano: "Introduce un email válido", no "Invalid email".
 * Estado de error con id="<id>-error" + aria-describedby para lectores de pantalla.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leading,
    trailing,
    className,
    id,
    ...rest
  },
  ref
) {
  const reactId = React.useId();
  const inputId = id || `np-input-${reactId}`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2 font-np-sans", className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="text-np-caption font-medium text-ink-7 uppercase tracking-wider"
        >
          {label}
        </label>
      ) : null}

      <div className="relative flex items-center">
        {leading ? (
          <span aria-hidden="true" className="absolute left-3 text-ink-6 pointer-events-none">
            {leading}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full h-12 rounded-lg",
            "bg-ink-0 border text-np-body text-ink-9",
            "placeholder:text-ink-5",
            "transition-all duration-200 ease-[var(--np-ease-out)]",
            "focus:outline-none focus:bg-ink-1",
            error
              ? "border-[color:var(--np-error)] focus:border-[color:var(--np-error)] focus:shadow-[0_0_0_3px_rgba(248,113,113,0.15)]"
              : "border-ink-3 hover:border-ink-4 focus:border-pri focus:shadow-[0_0_0_3px_rgba(79,124,255,0.15)]",
            leading ? "pl-10" : "pl-4",
            trailing ? "pr-12" : "pr-4"
          )}
          {...rest}
        />

        {trailing ? (
          <span className="absolute right-2 flex items-center">{trailing}</span>
        ) : null}
      </div>

      {error ? (
        <span id={errorId} className="text-np-caption text-[color:var(--np-error)] font-np-mono" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="text-np-caption text-ink-6">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
