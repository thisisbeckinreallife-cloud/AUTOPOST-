"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Shield, Lock, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
  MotionText,
  MotionMagnetic,
  BorderBeam,
  PriceMorph,
  EASE_CINEMATIC,
  SPRING_WOBBLY,
  SPRING_BOUNCE,
} from "@/components/motion";
import { TiltCard } from "@/components/landing/tilt-card";
import { PricingToggle } from "@/components/landing/pricing-toggle";

/* ─── Tiers ─── */

const pricingTiers = [
  {
    name: "Free",
    price: 0,
    priceLabel: "Gratis",
    description: "Para empezar sin compromiso",
    features: [
      "1 cuenta de Instagram",
      "30 posts por mes",
      "Deteccion de carruseles",
      "Extraccion de copy",
      "Publicacion via API oficial",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: 19,
    priceLabel: "$19/mes",
    description: "Para creadores y freelancers",
    features: [
      "5 cuentas de Instagram",
      "Posts ilimitados",
      "Posts colaborativos (Collabs)",
      "Flujo de aprobacion",
      "Soporte prioritario",
    ],
    cta: "Empezar con Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: 49,
    priceLabel: "$49/mes",
    description: "Para agencias y equipos",
    features: [
      "Cuentas ilimitadas",
      "Todo lo del plan Pro",
      "Panel multi-cliente",
      "Logs de auditoria",
      "Soporte directo prioritario",
    ],
    cta: "Empezar con Agency",
    popular: false,
  },
];

/* ─── Main Section ─── */

export function PricingSectionNew({
  isAnnual,
  onToggleAnnual,
}: {
  isAnnual: boolean;
  onToggleAnnual: () => void;
}) {
  return (
    <section id="precios" className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.012] to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <MotionReveal direction="up" blur cinematic>
          <div className="text-center mb-10">
            <motion.p
              className="text-xs font-semibold text-brand-400 uppercase tracking-[0.25em] mb-5"
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
            >
              Precios
            </motion.p>
            <MotionText
              as="h2"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
              effect="blur"
              highlight={{ words: ["sorpresas"], className: "text-gradient" }}
            >
              Simple y sin sorpresas
            </MotionText>
            <p className="text-zinc-400 text-base sm:text-lg mt-4 max-w-xl mx-auto">
              Elige el plan que se adapta a tu volumen. Cambia o cancela cuando quieras.
            </p>
          </div>
        </MotionReveal>

        <PricingToggle isAnnual={isAnnual} onToggle={onToggleAnnual} />

        <MotionStagger stagger={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-8">
          {pricingTiers.map((tier) => (
            <MotionStaggerItem key={tier.name} className="flex">
              {tier.popular ? (
                <BorderBeam
                  size={180}
                  duration={8}
                  color="#FFAA00"
                  colorTo="#6366F1"
                  borderWidth={1.5}
                >
                  <TiltCard shine>
                    <PricingCard tier={tier} isAnnual={isAnnual} />
                  </TiltCard>
                </BorderBeam>
              ) : (
                <TiltCard shine>
                  <PricingCard tier={tier} isAnnual={isAnnual} />
                </TiltCard>
              )}
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        {/* Trust badges */}
        <MotionReveal delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {[
              { icon: Shield, label: "Conexion oficial Meta API" },
              { icon: Lock, label: "Cifrado AES-256" },
              { icon: CheckCircle, label: "Cancela cuando quieras" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <Icon
                  className="h-3.5 w-3.5 text-brand-400"
                  aria-hidden="true"
                />
                {label}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-600 mt-4">
            Sin tarjeta de credito en el plan Free
          </p>
        </MotionReveal>
      </div>
    </section>
  );
}

/* ─── Card ─── */

function PricingCard({
  tier,
  isAnnual,
}: {
  tier: (typeof pricingTiers)[0];
  isAnnual: boolean;
}) {
  const annualPrice = tier.price > 0 ? Math.round(tier.price * 0.8) : 0;
  const displayPrice =
    isAnnual && tier.price > 0
      ? `$${annualPrice}`
      : tier.price === 0
        ? "Gratis"
        : `$${tier.price}`;

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-7 flex flex-col gap-6 h-full card-glow-hover w-full",
        tier.popular
          ? "border-transparent bg-surface-card border-rotating"
          : "border-white/[0.06] bg-surface-card"
      )}
      aria-label={`Plan ${tier.name}`}
    >
      {tier.popular && (
        <div className="absolute inset-[1.5px] rounded-2xl bg-surface-card z-0" />
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Popular badge */}
        {tier.popular && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <motion.span
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-brand-magic text-white shadow-glow-sm whitespace-nowrap inline-flex items-center gap-1.5"
              initial={{ scale: 0, rotate: -10 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={SPRING_WOBBLY}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Mas popular
            </motion.span>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
            {tier.name}
          </p>
          <div className="flex items-baseline gap-2">
            <PriceMorph
              value={displayPrice}
              className="font-display font-extrabold text-4xl text-white"
            />
            {tier.price > 0 && (
              <span className="text-sm text-zinc-500">/mes</span>
            )}
          </div>
          {isAnnual && tier.price > 0 && (
            <p className="text-xs text-zinc-600 mt-1 line-through">
              ${tier.price}/mes
            </p>
          )}
          <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] mb-6" />

        {/* Features */}
        <ul className="space-y-2.5 flex-1 mb-6">
          {tier.features.map((f, i) => (
            <motion.li
              key={f}
              className="flex items-start gap-2.5 text-sm text-zinc-300"
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.1 + i * 0.08,
                duration: 0.5,
                ease: EASE_CINEMATIC,
              }}
            >
              <CheckCircle
                className="h-4 w-4 text-brand-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              {f}
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto">
          <MotionMagnetic strength={0.08}>
            <Link
              href="/signup"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-300 btn-ripple w-full active:scale-[0.97] active:translate-y-0.5",
                tier.popular
                  ? "bg-gradient-brand-vivid text-white shadow-glow btn-glow"
                  : "border border-white/[0.1] text-zinc-300 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.04]"
              )}
            >
              {tier.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </MotionMagnetic>
        </div>
      </div>
    </div>
  );
}
