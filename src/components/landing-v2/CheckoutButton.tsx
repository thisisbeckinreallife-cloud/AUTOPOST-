"use client";

/**
 * CheckoutButton — CTA de cada tier en la sección Pricing.
 *
 * Comportamiento:
 *  - Si el usuario tiene sesión → POST /api/stripe/checkout y redirige a
 *    la URL devuelta por Stripe.
 *  - Si NO tiene sesión → redirige a /signup con next=checkout y guarda el
 *    tier+period como query params para retomar el checkout tras crear cuenta.
 *
 * UX:
 *  - Mientras la API responde, deshabilitamos el botón y mostramos "Cargando…".
 *  - Si la API devuelve error, mostramos el mensaje en un toast inline (debajo).
 *  - Sin tracking de errores externo aquí — los errores de Stripe ya quedan
 *    logueados server-side.
 *
 * Estilos: replican exactamente lo que el `<Link>` anterior tenía para que
 * Pricing.tsx no necesite cambios.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/brand/cn";

export type CheckoutTier = "basic" | "pro" | "agency";

interface CheckoutButtonProps {
  tier: CheckoutTier;
  period: "weekly" | "yearly";
  featured?: boolean;
  children: React.ReactNode;
}

interface CheckoutResponse {
  url?: string;
  sessionId?: string;
  error?: string;
  message?: string;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center h-12 px-5 rounded-lg font-medium text-np-body transition-all duration-200";

const FEATURED_CLASSES =
  "bg-accent text-ink-0 shadow-md hover:bg-accent-hover hover:-translate-y-px";

const DEFAULT_CLASSES =
  "bg-transparent text-ink-8 border border-ink-3 hover:border-ink-5 hover:bg-ink-2";

const DISABLED_CLASSES = "opacity-60 cursor-not-allowed pointer-events-none";

export function CheckoutButton({
  tier,
  period,
  featured = false,
  children,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, period }),
        // No-store: la respuesta tiene URL temporal y nunca debe cachearse.
        cache: "no-store",
      });

      const data = (await res.json().catch(() => ({}))) as CheckoutResponse;

      // 401 → no hay sesión. Redirige a /signup con el tier+period guardado.
      if (res.status === 401) {
        const params = new URLSearchParams({
          next: "checkout",
          tier,
          period,
        });
        router.push(`/signup?${params.toString()}`);
        return;
      }

      if (!res.ok || !data.url) {
        const message =
          data.message ??
          "No pudimos abrir el pago. Vuelve a intentarlo en unos segundos.";
        setError(message);
        setLoading(false);
        return;
      }

      // Hard redirect a Stripe — usamos location.assign para que Stripe
      // pueda hacer su propio control sobre history (volver atrás cancela).
      window.location.assign(data.url);
    } catch (err) {
      console.error("[CheckoutButton] error", err);
      setError("Hubo un problema con tu conexión. Reintenta en unos segundos.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading}
        className={cn(
          BASE_CLASSES,
          featured ? FEATURED_CLASSES : DEFAULT_CLASSES,
          loading && DISABLED_CLASSES
        )}
      >
        {loading ? "Cargando…" : children}
      </button>

      {error ? (
        <p
          role="alert"
          className="text-xs text-error-strong text-center"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
