"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/components/brand/cn";

interface Tier {
  name: string;
  desc: string;
  monthly: number;
  yearly: number;
  features: string[];
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Solo",
    desc: "Para creators y emprendedores.",
    monthly: 19,
    yearly: 15,
    features: ["1 cuenta · 3 redes", "50 posts/mes", "IA detección formato", "Calendario semanal", "Soporte email"],
  },
  {
    name: "Pro",
    desc: "Para social media managers y agencias pequeñas.",
    monthly: 49,
    yearly: 39,
    features: ["3 cuentas · 7 redes", "200 posts/mes", "IA copy en tu tono", "Heatmap mejor hora", "Analytics completo", "Soporte prioritario"],
    featured: true,
  },
  {
    name: "Studio",
    desc: "Para agencias y equipos.",
    monthly: 149,
    yearly: 119,
    features: ["10 cuentas · todas las redes", "Posts ilimitados", "Equipo: 5 usuarios", "API + webhooks", "SSO + auditoría", "Account manager"],
  },
];

export function Pricing() {
  const [period, setPeriod] = React.useState<"monthly" | "yearly">("monthly");

  return (
    <section id="pricing" className="py-24 px-6 max-w-[1100px] mx-auto">
      <header className="text-center max-w-[720px] mx-auto mb-12">
        <div className="inline-block font-np-mono text-np-caption text-pri uppercase tracking-widest mb-3">
          PRECIOS
        </div>
        <h2 className="font-np-sans text-np-display font-semibold text-ink-9 leading-tight tracking-tight">
          Precios que escalan contigo
        </h2>
        <p className="text-np-body-lg text-ink-7 mt-4">
          Cancela cuando quieras. Sin permanencia.
        </p>
      </header>

      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 p-1 bg-ink-1 border border-ink-3 rounded-full">
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={cn(
              "px-5 py-2 rounded-full text-np-body transition-all",
              period === "monthly"
                ? "bg-pri text-ink-10 font-medium"
                : "bg-transparent text-ink-7 hover:text-ink-9"
            )}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setPeriod("yearly")}
            className={cn(
              "relative px-5 py-2 rounded-full text-np-body transition-all",
              period === "yearly"
                ? "bg-pri text-ink-10 font-medium"
                : "bg-transparent text-ink-7 hover:text-ink-9"
            )}
          >
            Anual
            <span className="absolute -top-2 -right-2 inline-block px-1.5 py-0.5 rounded-full bg-ai text-ink-10 font-np-mono text-[9px] uppercase tracking-wider">
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
    </section>
  );
}

function TierCard({ tier, period }: { tier: Tier; period: "monthly" | "yearly" }) {
  const price = period === "monthly" ? tier.monthly : tier.yearly;
  return (
    <article
      className={cn(
        "relative bg-ink-1 border rounded-2xl p-8 flex flex-col",
        tier.featured
          ? "border-pri shadow-[var(--np-glow-blue)] bg-gradient-to-b from-pri-soft to-transparent"
          : "border-ink-3"
      )}
    >
      {tier.featured ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pri text-ink-10 font-np-mono text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full">
          Recomendado
        </div>
      ) : null}

      <h3 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-1 tracking-tight">
        {tier.name}
      </h3>
      <p className="text-np-body text-ink-7 mb-6">{tier.desc}</p>

      <div className="flex items-baseline gap-1 mb-6">
        <span
          className="font-np-sans font-semibold text-ink-9 leading-none"
          style={{ fontSize: "56px", letterSpacing: "-0.02em" }}
        >
          {price}€
        </span>
        <span className="font-np-mono text-np-caption text-ink-6">/mes</span>
      </div>

      <ul className="flex flex-col gap-2 mb-8 flex-1">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2 text-np-body text-ink-8">
            <span aria-hidden="true" className="text-[color:var(--np-success)] flex-shrink-0 mt-1">
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
            ? "bg-pri text-ink-10 shadow-[var(--np-shadow-sm),var(--np-glow-blue)] hover:bg-pri-dim hover:-translate-y-px"
            : "bg-transparent text-ink-8 border border-ink-3 hover:border-ink-5 hover:bg-ink-2"
        )}
      >
        Empezar
      </Link>
    </article>
  );
}
