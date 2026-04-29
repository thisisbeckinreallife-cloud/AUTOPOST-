"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Lock, CheckCircle } from "lucide-react";
import {
  MotionStagger,
  MotionStaggerItem,
  MotionMagnetic,
  PriceMorph,
  EASE_CINEMATIC,
  SPRING_WOBBLY,
} from "@/components/motion";
import { TiltCard } from "@/components/landing/tilt-card";
import { PricingToggle } from "@/components/landing/pricing-toggle";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { Icon } from "@/components/editorial/atoms";

const pricingTiers = [
  {
    name: "Free",
    price: 0,
    description: "Para empezar sin compromiso",
    features: [
      "1 cuenta de Instagram",
      "30 posts por mes",
      "Detección de carruseles",
      "Extracción de copy",
      "Publicación vía API oficial",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: 19,
    description: "Para creadores y freelancers",
    features: [
      "5 cuentas de Instagram",
      "Posts ilimitados",
      "Posts colaborativos (Collabs)",
      "Flujo de aprobación",
      "Soporte prioritario",
    ],
    cta: "Empezar con Pro",
    popular: true,
  },
  {
    name: "Agency",
    price: 49,
    description: "Para agencias y equipos",
    features: [
      "Cuentas ilimitadas",
      "Todo lo del plan Pro",
      "Panel multi-cliente",
      "Logs de auditoría",
      "Soporte directo prioritario",
    ],
    cta: "Empezar con Agency",
    popular: false,
  },
];

export function PricingSectionNew({
  isAnnual,
  onToggleAnnual,
}: {
  isAnnual: boolean;
  onToggleAnnual: () => void;
}) {
  return (
    <MagazineSection
      id="precios"
      index="09"
      kicker="PRECIOS"
      title={
        <>
          Simple y <i>sin sorpresas</i>.
        </>
      }
      lede="Elige el plan que se adapta a tu volumen. Cambia o cancela cuando quieras."
      align="center"
    >
      <PricingToggle isAnnual={isAnnual} onToggle={onToggleAnnual} />

      <MotionStagger
        stagger={0.12}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch mt-10"
      >
        {pricingTiers.map((tier) => (
          <MotionStaggerItem key={tier.name} className="flex">
            <TiltCard shine={false}>
              <PricingCard tier={tier} isAnnual={isAnnual} />
            </TiltCard>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      {/* Trust strip — hairline footer */}
      <div
        className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-6"
        style={{ borderTop: "1px solid var(--ap-line)" }}
      >
        {[
          { icon: Shield, label: "Conexión oficial Meta API" },
          { icon: Lock, label: "Cifrado AES-256" },
          { icon: CheckCircle, label: "Cancela cuando quieras" },
        ].map(({ icon: TrustIcon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2"
            style={{
              fontSize: 11,
              fontFamily: "var(--ap-font-mono)",
              color: "var(--ap-ink-4)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <TrustIcon
              strokeWidth={1.5}
              className="h-3.5 w-3.5"
              style={{ color: "var(--ap-ink-3)" }}
              aria-hidden="true"
            />
            {label}
          </div>
        ))}
      </div>
      <p
        className="ap-mono"
        style={{
          textAlign: "center",
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginTop: 14,
        }}
      >
        Sin tarjeta de crédito en el plan Free
      </p>
    </MagazineSection>
  );
}

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
      className="relative flex flex-col h-full w-full"
      style={{
        padding: "32px 28px",
        border: tier.popular
          ? "2px solid var(--ap-stamp)"
          : "1px solid var(--ap-line-2)",
        background: "var(--ap-paper-2)",
      }}
      aria-label={`Plan ${tier.name}`}
    >
      {/* Popular stamp-chip */}
      {tier.popular && (
        <div
          className="absolute"
          style={{
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <motion.span
            className="ap-stamp-chip"
            style={{ background: "var(--ap-paper)" }}
            initial={{ scale: 0, rotate: -12 }}
            whileInView={{ scale: 1, rotate: -3 }}
            viewport={{ once: true }}
            transition={SPRING_WOBBLY}
          >
            Para ti
          </motion.span>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="mb-6">
          <p
            className="ap-mono"
            style={{
              fontSize: 11,
              color: tier.popular ? "var(--ap-stamp)" : "var(--ap-ink-4)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
              fontWeight: 600,
            }}
          >
            {tier.name}
          </p>
          <div className="flex items-baseline gap-2">
            <PriceMorph
              value={displayPrice}
              className="ap-display"
            />
            {tier.price > 0 && (
              <span
                className="ap-mono"
                style={{
                  fontSize: 12,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                /mes
              </span>
            )}
          </div>
          {isAnnual && tier.price > 0 && (
            <p
              style={{
                fontSize: 12,
                color: "var(--ap-ink-4)",
                margin: "6px 0 0",
              }}
            >
              <s
                style={{
                  textDecorationColor: "var(--ap-stamp)",
                  textDecorationThickness: "1.5px",
                }}
              >
                ${tier.price}/mes
              </s>
            </p>
          )}
          <p
            style={{
              fontSize: 14,
              color: "var(--ap-ink-3)",
              fontStyle: "italic",
              margin: "10px 0 0",
            }}
          >
            {tier.description}
          </p>
        </div>

        {/* Hairline divider */}
        <div
          style={{
            borderTop: "1px solid var(--ap-line)",
            marginBottom: 24,
          }}
        />

        {/* Features */}
        <ul className="flex-1 mb-6" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tier.features.map((f, i) => (
            <motion.li
              key={f}
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.1 + i * 0.06,
                duration: 0.5,
                ease: EASE_CINEMATIC,
              }}
              style={{
                fontSize: 13,
                color: "var(--ap-ink-2)",
                padding: "8px 0",
                lineHeight: 1.55,
              }}
            >
              <span style={{ marginTop: 3, flexShrink: 0 }}>
                <Icon name="check" size={14} c="var(--ap-stamp)" sw={1.8} />
              </span>
              {f}
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto">
          <MotionMagnetic strength={0.08}>
            <Link
              href="/signup"
              className={tier.popular ? "ap-btn ap-btn--stamp" : "ap-btn ap-btn--ghost"}
              style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                padding: "14px 20px",
                fontSize: 13,
                gap: 8,
              }}
            >
              {tier.cta}
              <ArrowRight strokeWidth={1.5} className="h-3.5 w-3.5" />
            </Link>
          </MotionMagnetic>
        </div>
      </div>
    </div>
  );
}
