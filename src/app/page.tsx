"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  Layers,
  Clock,
  Shield,
  Instagram,
  Users,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { StickyCTA } from "@/components/landing/sticky-cta";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { ProductDemo } from "@/components/landing/product-demo";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { BenefitsScroll } from "@/components/landing/benefits-scroll";
import { PricingSectionNew } from "@/components/landing/pricing-section";
import { HatchHowItWorks } from "@/components/landing/hatch-how-it-works";
import { I18nProvider } from "@/components/editorial/i18n";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { RichText } from "@/components/editorial/RichText";
import { Logo, Avatar, Icon } from "@/components/editorial/atoms";
import {
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
  MotionMagnetic,
  EASE_OUT_EXPO,
  SPRING_BOUNCE,
  SPRING_WOBBLY,
} from "@/components/motion";

export default function LandingPage() {
  const [, setNavScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="ap-root min-h-screen overflow-x-hidden"
      style={{ background: "var(--ap-paper)", color: "var(--ap-ink)" }}
    >
      {/* Skip link para teclado/screen readers */}
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:font-semibold focus:text-sm focus:shadow-xl focus:outline-none"
        style={{ background: "var(--ap-ink)", color: "var(--ap-paper)" }}
      >
        Saltar al contenido principal
      </a>

      <StickyCTA />
      <ScrollProgress />

      {/* ═══════════════════════════════════════════════════════════════════
           HERO EDITORIAL — print-zine, Instrument Serif, FocalPiece animado
           ═══════════════════════════════════════════════════════════════════ */}
      <main id="contenido-principal">
      <I18nProvider defaultLang="es">
        <EditorialHero />
      </I18nProvider>

      {/* Trust strip bajo hero — hairline editorial */}
      <SocialProofStrip />

      {/* 01 · Cómo funciona */}
      <HatchHowItWorks />

      {/* 04 · Demo */}
      <ProductDemo />

      {/* ═══════════════════════════════════════════════════════════════════
           02 · BEFORE / AFTER — spread editorial con tachados tomate
           ═══════════════════════════════════════════════════════════════════ */}
      <MagazineSection
        index="02"
        kicker="ANTES / DESPUÉS"
        title={
          <>
            Lo que <i>hacían</i> a mano,{" "}
            <RichText text="<wave>en 2 minutos</wave>" />
          </>
        }
        lede="Subes carpeta. AutoPost detecta carruseles, asocia copy, programa el mes. Mientras duermes, publica."
      >
        <div className="max-w-4xl mx-auto relative">
          <MotionReveal direction="up" cinematic>
            <div
              className="relative grid grid-cols-1 md:grid-cols-2"
              style={{
                borderTop: "1.5px solid var(--ap-ink)",
                borderBottom: "1.5px solid var(--ap-ink)",
              }}
            >
              {/* Stamp central */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex pointer-events-none"
                style={{
                  background: "var(--ap-paper)",
                  padding: "8px 4px",
                }}
              >
                <motion.span
                  className="ap-stamp-chip"
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: -3 }}
                  viewport={{ once: true }}
                  transition={SPRING_WOBBLY}
                >
                  2h → 2min
                </motion.span>
              </div>

              {/* Before */}
              <div
                className="p-8 space-y-4"
                style={{
                  borderRight: "1px solid var(--ap-line)",
                  background: "var(--ap-paper)",
                }}
              >
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  Cómo lo haces hoy
                </p>
                <MotionStagger stagger={0.1}>
                  {[
                    "Subir cada foto una a una",
                    "Copiar y pegar cada caption manualmente",
                    "Arrastrar y soltar para ordenar el carrusel",
                    "Configurar la fecha de cada post por separado",
                    "2-3 horas de trabajo por cliente",
                  ].map((item) => (
                    <MotionStaggerItem key={item} direction="left">
                      <div className="flex items-start gap-3">
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            border: "1px solid var(--ap-ink-4)",
                            display: "inline-block",
                            flexShrink: 0,
                            marginTop: 8,
                          }}
                        />
                        <p
                          style={{
                            fontSize: 14,
                            color: "var(--ap-ink-4)",
                            lineHeight: 1.6,
                            textDecoration: "line-through",
                            textDecorationColor: "var(--ap-stamp)",
                            textDecorationThickness: "1.5px",
                            margin: 0,
                          }}
                        >
                          {item}
                        </p>
                      </div>
                    </MotionStaggerItem>
                  ))}
                </MotionStagger>
              </div>

              {/* After */}
              <div
                className="p-8 space-y-4"
                style={{ background: "var(--ap-paper-2)" }}
              >
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ap-stamp)",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  Cómo será con AutoPost
                </p>
                <MotionStagger stagger={0.1}>
                  {[
                    "Subir una carpeta o ZIP con todo",
                    "Copy extraído automáticamente del .txt",
                    "Carruseles detectados sin numerar fotos",
                    "30 días de programación en una sola configuración",
                    "2 minutos por cliente",
                  ].map((item) => (
                    <MotionStaggerItem key={item} direction="right">
                      <div className="flex items-start gap-3">
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ ...SPRING_BOUNCE, delay: 0.3 }}
                          style={{ marginTop: 2, flexShrink: 0 }}
                        >
                          <Icon name="check" size={16} c="var(--ap-stamp)" sw={1.8} />
                        </motion.div>
                        <p
                          style={{
                            fontSize: 14,
                            color: "var(--ap-ink-2)",
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {item}
                        </p>
                      </div>
                    </MotionStaggerItem>
                  ))}
                </MotionStagger>
              </div>
            </div>
          </MotionReveal>
        </div>
      </MagazineSection>

      {/* ═══════════════════════════════════════════════════════════════════
           03 · CARACTERÍSTICAS — Bento editorial
           ═══════════════════════════════════════════════════════════════════ */}
      <MagazineSection
        index="03"
        kicker="CARACTERÍSTICAS"
        title={
          <>
            Diseñado para hacer mucho en{" "}
            <i>poco tiempo</i>.
          </>
        }
      >
        <MotionStagger
          stagger={0.08}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <MotionStaggerItem className="sm:col-span-2">
            <BentoCard
              icon={<Layers className="h-5 w-5" strokeWidth={1.5} />}
              title="Cuatro fotos, un carrusel"
              description="AutoPost lee el orden de la carpeta y lo respeta. Como un editor que conoce tu maquetación: detecta el patrón, no exige que numeres."
              size="large"
            />
          </MotionStaggerItem>

          <MotionStaggerItem>
            <BentoCard
              icon={<CheckCircle className="h-5 w-5" strokeWidth={1.5} />}
              title="Copy desde .txt"
              description="Cada caption en un archivo. AutoPost lo asocia. Cero copia y pega."
            />
          </MotionStaggerItem>

          <MotionStaggerItem>
            <BentoCard
              icon={<Clock className="h-5 w-5" strokeWidth={1.5} />}
              title="El calendario se llena solo"
              description="Frecuencia, días y horario. AutoPost coloca cada post en su hueco como una brigada de cocina."
            />
          </MotionStaggerItem>

          <MotionStaggerItem>
            <BentoCard
              icon={<Shield className="h-5 w-5" strokeWidth={1.5} />}
              title="API oficial de Meta"
              description="OAuth oficial. Tu contraseña no se almacena ni se comparte. Tokens cifrados AES-256."
            />
          </MotionStaggerItem>

          <MotionStaggerItem>
            <BentoCard
              icon={<Instagram className="h-5 w-5" strokeWidth={1.5} />}
              title="Fotos, vídeos y reels"
              description="JPG, PNG, WEBP, MP4 y MOV. Hasta 100 MB por archivo."
            />
          </MotionStaggerItem>

          <MotionStaggerItem className="sm:col-span-2">
            <BentoCard
              icon={<Users className="h-5 w-5" strokeWidth={1.5} />}
              title="Un post, dos firmas"
              description="Tu marca en dos feeds simultáneos vía la Collabs API oficial. Sin coordinaciones. Sin emails de ida y vuelta. Sin pedir permiso."
              size="large"
              highlight
              badge="Único"
            />
          </MotionStaggerItem>

          <MotionStaggerItem>
            <BentoCard
              icon={<Eye className="h-5 w-5" strokeWidth={1.5} />}
              title="Antes de imprimir"
              description="Ves el feed completo del mes antes de confirmar. Como una galerada antes del cierre."
            />
          </MotionStaggerItem>
        </MotionStagger>
      </MagazineSection>

      {/* 05 · Por qué AutoPost */}
      <BenefitsScroll />

      {/* 06 · ROI Calculator */}
      <ROICalculator />

      {/* 08 · Comparison */}
      <ComparisonTable />

      {/* 07 · Testimonios */}
      <TestimonialsSection />

      {/* 09 · Pricing */}
      <PricingSectionNew
        isAnnual={isAnnual}
        onToggleAnnual={() => setIsAnnual(!isAnnual)}
      />

      {/* ═══════════════════════════════════════════════════════════════════
           10 · FAQ
           ═══════════════════════════════════════════════════════════════════ */}
      <MagazineSection
        index="10"
        kicker="PREGUNTAS FRECUENTES"
        title={
          <>
            Todo claro <RichText text="<wave>antes de empezar</wave>" />
          </>
        }
        align="center"
      >
        <div className="max-w-2xl mx-auto">
          <MotionReveal delay={0.1}>
            <FAQAccordion />
          </MotionReveal>
        </div>
      </MagazineSection>

      {/* ═══════════════════════════════════════════════════════════════════
           11 · ÚLTIMA LLAMADA — magazine masthead final
           ═══════════════════════════════════════════════════════════════════ */}
      <MagazineSection
        index="11"
        kicker="ÚLTIMA LLAMADA"
        title={
          <>
            Tu próximo mes de contenido,{" "}
            <RichText text="<wave>en 2 minutos</wave>" />
          </>
        }
        lede="Mientras tú duermes, AutoPost publica. Programa 30 días en 2 minutos."
        align="center"
      >
        <MotionReveal direction="up" cinematic>
          <div className="relative max-w-2xl mx-auto">
            <div
              className="relative p-12 sm:p-16 text-center"
              style={{
                border: "1.5px solid var(--ap-ink)",
                background: "var(--ap-paper)",
              }}
            >
              <span
                className="ap-stamp-chip absolute"
                style={{
                  top: -14,
                  right: 24,
                  background: "var(--ap-paper)",
                }}
              >
                Edición gratis
              </span>
              <MotionMagnetic strength={0.15} scale>
                <Link
                  href="/signup"
                  className="ap-btn ap-btn--stamp"
                  style={{
                    padding: "16px 26px",
                    fontSize: 14,
                    display: "inline-flex",
                  }}
                >
                  Empezar gratis — primera carpeta incluida
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              </MotionMagnetic>
              <p
                className="ap-mono"
                style={{
                  marginTop: 18,
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Sin tarjeta · Sin compromisos
              </p>
            </div>
          </div>
        </MotionReveal>
      </MagazineSection>
      </main>

      {/* ─── Footer editorial ─── */}
      <MotionReveal>
        <footer
          className="ap-root"
          style={{
            background: "var(--ap-paper)",
            borderTop: "1px solid var(--ap-rule)",
            padding: "40px 24px 32px",
          }}
        >
          <div
            className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
          >
            <Logo size={16} />
            <p
              className="ap-display"
              style={{
                fontSize: 14,
                fontStyle: "italic",
                color: "var(--ap-ink-3)",
                margin: 0,
              }}
            >
              Hecho para agencias e influencers hispanohablantes
            </p>
            <div
              className="flex items-center gap-5"
              style={{ fontSize: 12, color: "var(--ap-ink-3)" }}
            >
              <Link
                href="/privacidad"
                style={{
                  borderBottom: "1px solid transparent",
                  paddingBottom: 1,
                  transition: "border-color 0.2s",
                }}
                className="hover:border-current"
              >
                Política de privacidad
              </Link>
              <Link
                href="/terminos"
                style={{
                  borderBottom: "1px solid transparent",
                  paddingBottom: 1,
                  transition: "border-color 0.2s",
                }}
                className="hover:border-current"
              >
                Términos de uso
              </Link>
            </div>
          </div>
          <p
            className="ap-mono"
            style={{
              marginTop: 28,
              textAlign: "center",
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ✦ AUTOPOST · MMXXVI
          </p>
        </footer>
      </MotionReveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUBCOMPONENTES — Bento editorial + Testimonials editorial
   ═══════════════════════════════════════════════════════════════════ */

function SocialProofStrip() {
  return (
    <section
      className="ap-root"
      aria-label="Confianza y reconocimiento"
      style={{
        background: "var(--ap-paper)",
        borderTop: "1px solid var(--ap-line)",
        borderBottom: "1px solid var(--ap-line)",
        padding: "clamp(20px, 2.5vw, 28px) clamp(20px, 5vw, 56px)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "clamp(16px, 3.5vw, 56px)",
          fontFamily: "var(--ap-font-mono)",
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ap-ink-3)",
        }}
      >
        <span className="flex items-center gap-2">
          <span style={{ color: "var(--ap-stamp)" }}>✦</span>
          2.184 marcas confían
        </span>
        <span style={{ width: 1, height: 14, background: "var(--ap-line-2)" }} aria-hidden />
        <span className="flex items-center gap-2">
          <span style={{ letterSpacing: "0.05em", color: "var(--ap-stamp)" }}>★★★★★</span>
          4.9 en G2
        </span>
        <span style={{ width: 1, height: 14, background: "var(--ap-line-2)" }} aria-hidden />
        <span className="flex items-center gap-2">
          <span style={{ color: "var(--ap-olive)" }}>●</span>
          API oficial Meta
        </span>
        <span style={{ width: 1, height: 14, background: "var(--ap-line-2)" }} aria-hidden />
        <span className="flex items-center gap-2">
          <span style={{ color: "var(--ap-mustard)" }}>✦</span>
          Visto en Product Hunt
        </span>
      </div>
    </section>
  );
}

function BentoCard({
  icon,
  title,
  description,
  size = "normal",
  highlight,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  size?: "normal" | "large";
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={cn(
        "group relative h-full transition-all",
        size === "large" ? "sm:flex sm:items-start sm:gap-5" : "",
      )}
      style={{
        padding: "clamp(20px, 2.5vw, 32px)",
        border: highlight
          ? "1.5px solid var(--ap-ink)"
          : "1px solid var(--ap-line)",
        background: highlight ? "rgba(212,166,39,0.08)" : "var(--ap-paper-2)",
      }}
    >
      <div className="shrink-0 mb-3 sm:mb-0" style={{ color: highlight ? "var(--ap-stamp)" : "var(--ap-ink)" }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3
            className="ap-display"
            style={{
              fontSize: 17,
              fontStyle: "italic",
              color: "var(--ap-ink)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {title}
          </h3>
          {badge && (
            <span
              className="ap-stamp-chip"
              style={{ transform: "rotate(-3deg)" }}
            >
              {badge}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 14,
            color: "var(--ap-ink-3)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

const testimonials = [
  {
    quote:
      "Antes tardábamos 3 horas cada lunes preparando el contenido de los clientes. Ahora subimos el ZIP y listo en 5 minutos.",
    name: "Marina López",
    role: "Directora Social Media · Agencia Pulso",
    initials: "ML",
  },
  {
    quote:
      "La detección de carruseles es increíble. Ya no tengo que numerar las fotos ni preocuparme por el orden.",
    name: "Diego Sánchez",
    role: "Content Creator · @diegoviaja",
    initials: "DS",
  },
  {
    quote:
      "Gestionamos 12 cuentas. Sin AutoPost no podríamos. El plan Agencia se pagó solo el primer mes.",
    name: "Carla Fuentes",
    role: "CEO · SocialCraft Agency",
    initials: "CF",
  },
  {
    quote:
      "El flujo de trabajo es tan simple que lo configuré en 5 minutos. Mis clientes están encantados con la consistencia.",
    name: "Andrés Ramírez",
    role: "Freelance Social Media Manager",
    initials: "AR",
  },
  {
    quote:
      "Posts colaborativos automáticos. Eso no lo tiene ningún otro scheduler. Game changer para nuestras campañas.",
    name: "Lucía Mendoza",
    role: "Growth Lead · BrandUp Studio",
    initials: "LM",
  },
  {
    quote:
      "Antes usaba Later y tardaba 2 horas por cuenta. Con AutoPost son 2 minutos literales. No exagero.",
    name: "Pablo Torres",
    role: "Social Media · @foodie.madrid",
    initials: "PT",
  },
];

function TestimonialsSection() {
  return (
    <MagazineSection
      index="07"
      kicker="TESTIMONIOS"
      title={
        <>
          Lo que dicen <i>quienes ya lo usan</i>.
        </>
      }
      align="center"
    >
      <div className="-mx-6 sm:-mx-14 overflow-hidden">
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          {[...testimonials, ...testimonials].map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} {...t} />
          ))}
        </motion.div>
      </div>
    </MagazineSection>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  initials,
}: (typeof testimonials)[0]) {
  return (
    <motion.div
      className="relative shrink-0 flex flex-col gap-5"
      style={{
        width: 340,
        padding: "28px 30px",
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
    >
      <span
        aria-hidden="true"
        className="ap-display"
        style={{
          position: "absolute",
          top: 8,
          right: 18,
          fontSize: 56,
          fontStyle: "italic",
          color: "var(--ap-stamp)",
          opacity: 0.4,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        &ldquo;
      </span>
      <p
        style={{
          fontSize: 14,
          color: "var(--ap-ink-2)",
          lineHeight: 1.55,
          fontStyle: "italic",
          margin: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3 mt-auto">
        <Avatar initials={initials} size={28} />
        <div>
          <p
            style={{
              fontSize: 13,
              color: "var(--ap-ink)",
              fontWeight: 500,
              margin: 0,
            }}
          >
            {name}
          </p>
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "2px 0 0",
            }}
          >
            {role}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
