"use client";

import * as React from "react";
import { cn } from "@/components/brand/cn";

export interface GoogleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  /** Si pasas `from`, lo añadimos a /api/auth/google/start como query */
  from?: string;
  /** Si false, oculta el botón (cuando OAuth no está configurado) */
  show?: boolean;
}

/**
 * GoogleButton — botón "Continuar con Google" con logo color real.
 *
 * Hace navigate a /api/auth/google/start?from=… que redirige al consent
 * de Google. La cookie de state CSRF se setea server-side.
 *
 * Si `show=false` (OAuth no configurado en backend), oculta el botón
 * sin romper el layout. Para no mostrar "Continue with Google" en
 * un sitio donde no funciona.
 */
export const GoogleButton = React.forwardRef<HTMLButtonElement, GoogleButtonProps>(
  function GoogleButton(
    { label = "Continuar con Google", from, show = true, className, type = "button", ...rest },
    ref
  ) {
    if (!show) return null;

    const href = from
      ? `/api/auth/google/start?from=${encodeURIComponent(from)}`
      : "/api/auth/google/start";

    return (
      <button
        ref={ref}
        type={type}
        onClick={() => {
          window.location.href = href;
        }}
        className={cn(
          "w-full inline-flex items-center justify-center gap-3",
          "h-12 px-5 rounded-lg",
          "bg-ink-1 border border-ink-3 text-ink-9 font-medium font-np-sans",
          "transition-all duration-200 ease-[var(--np-ease-out)]",
          "hover:border-ink-5 hover:bg-ink-2 hover:-translate-y-px",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pri",
          "active:translate-y-0",
          className
        )}
        {...rest}
      >
        {/* Logo Google con colores oficiales */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15A11 11 0 0 0 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        <span>{label}</span>
      </button>
    );
  }
);
