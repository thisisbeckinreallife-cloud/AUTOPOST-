"use client";

import * as React from "react";
import { cn } from "@/components/brand/cn";

const ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: "Cancelaste el inicio de sesión con Google. Inténtalo otra vez si quieres.",
  google_invalid_callback: "Algo falló al volver de Google. Inténtalo otra vez.",
  google_state_mismatch: "Por seguridad cancelamos el intento. Empieza de nuevo desde aquí.",
  google_email_collision: "Ese email ya tiene otra cuenta de Google asociada. Entra con email y contraseña.",
  google_oauth_not_configured: "Google no está disponible aún. Usa email y contraseña por ahora.",
  google_token_exchange_failed: "Google no pudo confirmar tu identidad. Inténtalo otra vez.",
  google_token_expired: "El enlace de Google expiró. Inicia sesión de nuevo.",
  google_internal: "Algo falló de nuestro lado. Inténtalo en un momento.",
  invalid_credentials: "Email o contraseña incorrectos.",
  rate_limit: "Demasiados intentos. Espera unos minutos antes de probar otra vez.",
  reset_token_invalid: "Este enlace de recuperación ya no vale. Pide uno nuevo.",
  reset_token_expired: "Este enlace ha expirado. Pide uno nuevo.",
};

/**
 * AuthError — banner rojo con mensaje en español plano.
 * Lee el código de error del query (?error=…) o lo recibe como prop.
 *
 * Usar en login/signup/reset para mostrar errores tras redirect.
 */
export function AuthError({
  code,
  message,
  className,
}: {
  code?: string | null;
  message?: string;
  className?: string;
}) {
  const text = message || (code ? ERROR_MESSAGES[code] || ERROR_MESSAGES.google_internal : null);
  if (!text) return null;

  return (
    <div
      role="alert"
      className={cn(
        "px-4 py-3 mb-4 rounded-lg",
        "bg-[color:var(--np-error-soft)] border border-[color:var(--np-error)]/40",
        "text-np-caption text-[color:var(--np-error)] font-np-sans",
        "flex items-start gap-2",
        className
      )}
    >
      <span aria-hidden="true" className="flex-shrink-0 mt-0.5">⚠</span>
      <span>{text}</span>
    </div>
  );
}
