"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/brand/cn";

interface Tier {
  name: string;
  desc: string;
  /** Precio facturado semanalmente. */
  weekly: number;
  /** Precio semanal equivalente cuando se factura anualmente (-20%). */
  yearly: number;
  features: string[];
  featured?: boolean;
}

/**
 * Pricing — Semanal · Carbon Workshop.
 *
 * Tres tiers con facturación SEMANAL: el modelo de pago refleja la cadencia
 * real del producto (subes una semana de contenido, te cobramos esa semana).
 * Trial 7 días sin tarjeta — la primera carga "se paga sola" antes de pedir
 * datos bancarios.
 *
 * Features sin jerga técnica: "API + webhooks" → "Conexión con Zapier/Make",
 * "SSO + auditoría" → "Inicio con Google + historial de cambios".
 */
const TIERS: Tier[] = [
  {
    name: "Básico",
    desc: "Para creators y emprendedores.",
    weekly: 5,
    yearly: 4,
    features: [
      "1 cuenta · 3 redes",
      "50 posts al mes",
      "La IA detecta el formato",
      "Calendario semanal",
      "Soporte por email",
    ],
  },
  {
    name: "Pro",
    desc: "Para social media managers y agencias pequeñas.",
    weekly: 7,
    yearly: 6,
    features: [
      "3 cuentas · 7 redes",
      "200 posts al mes",
      "La IA escribe en tu tono",
      "Mejor hora automática",
      "Análisis completo",
      "Soporte prioritario",
    ],
    featured: true,
  },
  {
    name: "Agency",
    desc: "Para agencias y equipos.",
    weekly: 10,
    yearly: 8,
    features: [
      "10 cuentas · todas las redes",
      "Posts ilimitados",
      "Equipo de 5 personas",
      "Conexión con Zapier y Make",
      "Inicio con Google + historial de cambios",
      "Account manager dedicado",
    ],
  },
];

export function Pricing() {
  const [period, setPeriod] = React.useState<"weekly" | "yearly">("weekly");

  return (
    <section id="pricing" className="py-24 px-6 max-w-[1100px] mx-auto">
      <header className="text-center max-w-[720px] mx-auto mb-8">
        <div className="inline-block font-np-mono text-np-caption text-accent uppercase tracking-widest mb-3">
          PRECIOS
        </div>
        <h2 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight">
          Precios semanales. Sin permanencia.
        </h2>
        <p className="text-np-body-lg text-ink-7 mt-4">
          Pruebas 7 días gratis sin tarjeta. Cancelas cuando quieras.
        </p>
      </header>

      {/* Trust strip — debajo del título, antes del toggle. */}
      <div className="flex justify-center mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-soft border border-accent/30 font-np-mono text-np-caption text-accent-strong">
          <span aria-hidden="true">✓</span>
          7 días gratis · sin tarjeta hasta el día 7
        </span>
      </div>

      {/* Toggle semanal / anual. */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 p-1 bg-ink-1 border border-ink-3 rounded-full">
          <button
            type="button"
            onClick={() => setPeriod("weekly")}
            className={cn(
              "px-5 py-2 rounded-full text-np-body transition-all",
              period === "weekly"
                ? "bg-accent text-ink-0 font-medium"
                : "bg-transparent text-ink-7 hover:text-ink-9"
            )}
          >
            Semanal
          </button>
          <button
            type="button"
            onClick={() => setPeriod("yearly")}
            className={cn(
              "relative px-5 py-2 rounded-full text-np-body transition-all",
              period === "yearly"
                ? "bg-accent text-ink-0 font-medium"
                : "bg-transparent text-ink-7 hover:text-ink-9"
            )}
          >
            Anual
            <span className="absolute -top-2 -right-2 inline-block px-1.5 py-0.5 rounded-full bg-accent text-ink-0 font-np-mono text-[9px] uppercase tracking-wider">
              -20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          <TierCard key={tier.name} tier={tier} period={period} />
        ))}
      </div>

      <p className="text-center text-xs text-ink-6 mt-8">
        Precios en euros. IVA no incluido. Pago semanal con Stripe.
      </p>
    </section>
  );
}

function TierCard({ tier, period }: { tier: Tier; period: "weekly" | "yearly" }) {
  const price = period === "weekly" ? tier.weekly : tier.yearly;
  return (
    <article
      className={cn(
        "relative bg-ink-1 border rounded-2xl p-8 flex flex-col",
        tier.featured
          ? "border-accent shadow-md bg-gradient-to-b from-accent-soft to-transparent"
          : "border-ink-3"
      )}
    >
      {tier.featured ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-ink-0 font-np-mono text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full">
          Recomendado
        </div>
      ) : null}

      <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-1 tracking-tight">
        {tier.name}
      </h3>
      <p className="text-np-body text-ink-7 mb-6">{tier.desc}</p>

      <div className="flex items-baseline gap-1 mb-2">
        <span
          className="font-np-sans font-semibold text-ink-9 leading-none"
          style={{ fontSize: "56px", letterSpacing: "-0.02em" }}
        >
          {price}€
        </span>
        <span className="font-np-mono text-np-caption text-ink-6">/sem</span>
      </div>
      <p className="text-xs text-ink-6 mb-6">
        {period === "yearly"
          ? `${tier.yearly * 52}€/año · facturación anual`
          : `Facturado cada semana · cancelas cuando quieras`}
      </p>

      <ul className="flex flex-col gap-2 mb-8 flex-1">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-np-body text-ink-8">
            <span aria-hidden="true" className="text-success-strong flex-shrink-0 mt-1">
              ✓
            </span>
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={cn(
          "inline-flex items-center justify-center h-12 px-5 rounded-lg font-medium text-np-body",
          "transition-all duration-200",
          tier.featured
            ? "bg-accent text-ink-0 shadow-md hover:bg-accent-hover hover:-translate-y-px"
            : "bg-transparent text-ink-8 border border-ink-3 hover:border-ink-5 hover:bg-ink-2"
        )}
      >
        Empezar 7 días gratis
      </Link>
    </article>
  );
}
