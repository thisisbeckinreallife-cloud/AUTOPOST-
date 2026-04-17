"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import {
  Zap,
  Upload,
  Calendar,
  CheckCircle,
  ArrowRight,
  Layers,
  Clock,
  Shield,
  Instagram,
  Sparkles,
  Users,
  Lock,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import { StatsStrip } from "@/components/landing/stats-strip";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { TiltCard } from "@/components/landing/tilt-card";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { StickyCTA } from "@/components/landing/sticky-cta";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { ProductDemo } from "@/components/landing/product-demo";
import { ComparisonTable } from "@/components/landing/comparison-table";
import { PricingToggle } from "@/components/landing/pricing-toggle";
import { BenefitsScroll } from "@/components/landing/benefits-scroll";
import { PricingSectionNew } from "@/components/landing/pricing-section";
import HeroScrollAnimation from "@/components/ui/hero-scroll-animation";
import HatchHero from "@/components/landing/hatch-hero";
import { HatchHowItWorks } from "@/components/landing/hatch-how-it-works";
import {
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
  MotionCounter,
  MotionText,
  MotionParallax,
  MotionMagnetic,
  MotionFloat,
  TextScramble,
  BorderBeam,
  AnimatedGridPattern,
  NumberTicker,
  PriceMorph,
  GlowingStars,
  Meteors,
  EASE_OUT_EXPO,
  EASE_CINEMATIC,
  EASE_BACK_OUT,
  SPRING_BOUNCE,
  SPRING_SNAPPY,
  SPRING_WOBBLY,
  DURATION,
  STAGGER,
  HERO_SEQ,
} from "@/components/motion";

// Dynamic import for 3D scene (kept for potential future use below-fold)
const HeroScene = dynamic(() => import("@/components/hero-3d/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="w-48 h-80 rounded-3xl skeleton opacity-20" />
    </div>
  ),
});

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden" onMouseMove={handleMouseMove}>
      <CustomCursor />
      <StickyCTA />
      <ScrollProgress />

      {/* ═══════════════════════════════════════════════════════════════════
           HERO HATCH — Pinned scroll cinematografico + How it works
           ═══════════════════════════════════════════════════════════════════ */}
      <HatchHero />
      <HatchHowItWorks />


      {/* ─── Product Demo (secciones AutoPost originales preservadas debajo) ─── */}
      <ProductDemo />

      {/* ═══════════════════════════════════════════════════════════════════
           BEFORE / AFTER — stagger with cross-out effect
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-primary via-brand-500/[0.01] to-surface-primary pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <MotionReveal direction="up" blur cinematic>
            <div className="rounded-2xl border border-brand-500/15 bg-white overflow-hidden relative card-shine shadow-card">
              {/* Center badge — pop animation (Aceternity Badge) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
                <motion.div
                  className="px-4 py-2 rounded-full bg-white shadow-md border border-brand-500/30 text-xs font-bold text-brand-400 shadow-glow-sm"
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={SPRING_WOBBLY}
                >
                  2h → 2min
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
                {/* Before */}
                <div className="p-8 space-y-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.15em]">Como lo haces hoy</p>
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
                          <span className="mt-0.5 h-4 w-4 rounded-full border border-accent-coral/30 bg-accent-coral/10 flex items-center justify-center shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent-coral/50" />
                          </span>
                          <p className="text-sm text-zinc-500 leading-relaxed line-through decoration-zinc-300">{item}</p>
                        </div>
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                </div>
                {/* After */}
                <div className="p-8 space-y-4 bg-amber-50/50">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.15em]">Como sera con AutoPost</p>
                  <MotionStagger stagger={0.1}>
                    {[
                      "Subir una carpeta o ZIP con todo",
                      "Copy extraido automaticamente del .txt",
                      "Carruseles detectados sin numerar fotos",
                      "30 dias de programacion en una sola configuracion",
                      "2 minutos por cliente",
                    ].map((item) => (
                      <MotionStaggerItem key={item} direction="right">
                        <div className="flex items-start gap-3">
                          <motion.div
                            initial={{ scale: 0, rotate: -90 }}
                            whileInView={{ scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ ...SPRING_BOUNCE, delay: 0.3 }}
                          >
                            <CheckCircle className="mt-0.5 h-4 w-4 text-brand-400 shrink-0" aria-hidden="true" />
                          </motion.div>
                          <p className="text-sm text-zinc-700 leading-relaxed">{item}</p>
                        </div>
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                </div>
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
           FEATURES — BENTO GRID with Aceternity card effects
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.012] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <MotionReveal direction="up" blur scale cinematic>
            <div className="text-center mb-20">
              <motion.p
                className="text-xs font-semibold text-brand-400 uppercase tracking-[0.25em] mb-5"
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
              >
                Caracteristicas
              </motion.p>
              <MotionText
                as="h2"
                className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
                effect="clip"
                highlight={{ words: ["poco"], className: "text-gradient" }}
              >
                Disenado para hacer mucho en poco tiempo
              </MotionText>
            </div>
          </MotionReveal>

          <MotionStagger stagger={0.08} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large card — spans 2 cols */}
            <MotionStaggerItem className="sm:col-span-2">
              <BentoCard
                icon={<Layers className="h-5 w-5 text-brand-400" />}
                title="Deteccion inteligente de carruseles"
                description="AutoPost agrupa tus fotos automaticamente en carruseles. No necesitas numerar nada — detecta el patron y organiza el contenido perfectamente."
                size="large"
                glow="brand"
              />
            </MotionStaggerItem>

            <MotionStaggerItem>
              <BentoCard
                icon={<CheckCircle className="h-5 w-5 text-accent-orange" />}
                title="Extraccion de copy"
                description="Lee archivos .txt y los asocia a cada post. Cero copia y pega."
                glow="orange"
              />
            </MotionStaggerItem>

            <MotionStaggerItem>
              <BentoCard
                icon={<Clock className="h-5 w-5 text-accent-indigo" />}
                title="Programacion inteligente"
                description="Frecuencia, dias y horario. El calendario se ajusta solo."
                glow="indigo"
              />
            </MotionStaggerItem>

            <MotionStaggerItem>
              <BentoCard
                icon={<Shield className="h-5 w-5 text-accent-emerald" />}
                title="Meta API oficial"
                description="OAuth oficial. Tu contrasena nunca se comparte."
                glow="emerald"
              />
            </MotionStaggerItem>

            <MotionStaggerItem>
              <BentoCard
                icon={<Instagram className="h-5 w-5 text-brand-400" />}
                title="Fotos, videos y reels"
                description="JPG, PNG, WEBP, MP4 y MOV. Hasta 100 MB."
                glow="brand"
              />
            </MotionStaggerItem>

            {/* Highlight card — spans 2 cols with GlowingStars */}
            <MotionStaggerItem className="sm:col-span-2">
              <BentoCard
                icon={<Users className="h-5 w-5 text-accent-indigo" />}
                title="Posts colaborativos"
                description="Aparece en dos feeds a la vez. Sin coordinacion manual — doble audiencia, un solo post. La funcionalidad que los demas no tienen."
                size="large"
                glow="indigo"
                highlight
                badge="Unico"
              />
            </MotionStaggerItem>

            <MotionStaggerItem>
              <BentoCard
                icon={<Eye className="h-5 w-5 text-accent-orange" />}
                title="Vista previa completa"
                description="Ve que se publicara y cuando antes de confirmar."
                glow="orange"
              />
            </MotionStaggerItem>
          </MotionStagger>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
           BENEFITS — Container scroll animation (Aceternity)
           ═══════════════════════════════════════════════════════════════════ */}
      <BenefitsScroll />

      {/* ─── ROI Calculator ─── */}
      <ROICalculator />

      {/* ─── Comparison Table ─── */}
      <ComparisonTable />

      {/* ═══════════════════════════════════════════════════════════════════
           TESTIMONIALS — Infinite marquee (Magic UI Marquee)
           ═══════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ═══════════════════════════════════════════════════════════════════
           PRICING — with moving border (Aceternity MovingBorder)
           ═══════════════════════════════════════════════════════════════════ */}
      <PricingSectionNew isAnnual={isAnnual} onToggleAnnual={() => setIsAnnual(!isAnnual)} />

      {/* ─── FAQ ─── */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 section-glow pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          <MotionReveal direction="up" blur cinematic>
            <div className="text-center mb-14">
              <motion.p
                className="text-xs font-semibold text-brand-400 uppercase tracking-[0.25em] mb-5"
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
              >
                Preguntas frecuentes
              </motion.p>
              <MotionText
                as="h2"
                className="font-display font-bold text-3xl sm:text-4xl tracking-tight"
                effect="blur"
                highlight={{ words: ["empezar"], className: "text-gradient" }}
              >
                Todo claro antes de empezar
              </MotionText>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <FAQAccordion />
          </MotionReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
           FINAL CTA — with magnetic button + border beam
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <MotionReveal direction="up" blur scale cinematic>
          <div className="relative max-w-2xl mx-auto text-center">
            <BorderBeam size={250} duration={10} color="#FFAA00" colorTo="#6366F1" borderWidth={2}>
              <div className="rounded-3xl border border-brand-500/20 bg-white shadow-lg p-12 sm:p-16 relative overflow-hidden card-glow-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-indigo-50/30 pointer-events-none rounded-3xl" />
                <div className="relative">
                  <MotionText
                    as="h2"
                    className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
                    effect="blur"
                    highlight={{ words: ["2", "minutos"], className: "text-gradient" }}
                  >
                    Tu proximo mes de contenido listo en 2 minutos
                  </MotionText>
                  <p className="text-lg text-zinc-500 mb-10 max-w-md mx-auto">
                    Mientras tu duermes, AutoPost publica. Programa 30 dias en 2 minutos.
                  </p>
                  <MotionMagnetic strength={0.15} scale>
                    <Link
                      href="/signup"
                      className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-base shadow-glow btn-glow btn-ripple btn-pulse-ring active:scale-[0.97] active:translate-y-0.5 transition-transform"
                    >
                      Empezar gratis — primera carpeta incluida
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </MotionMagnetic>
                  <p className="text-sm text-zinc-500 mt-4">
                    Sin tarjeta de credito. Sin compromisos.
                  </p>
                </div>
              </div>
            </BorderBeam>
          </div>
        </MotionReveal>
      </section>

      {/* ─── Footer ─── */}
      <MotionReveal>
        <footer className="border-t border-zinc-100 py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/15">
                <Zap className="h-3 w-3 text-brand-400" aria-hidden="true" />
              </div>
              <span className="font-display font-bold text-sm">AutoPost</span>
            </div>
            <p className="text-xs text-zinc-400">
              Hecho para agencias e influencers hispanohablantes
            </p>
            <div className="flex items-center gap-5 text-xs text-zinc-500">
              <a href="/privacidad" className="hover:text-zinc-900 transition-colors link-underline">
                Politica de privacidad
              </a>
              <a href="/terminos" className="hover:text-zinc-900 transition-colors link-underline">
                Terminos de uso
              </a>
            </div>
          </div>
        </footer>
      </MotionReveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUBCOMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function StepCard({
  number, icon, title, description, accent,
}: { number: string; icon: React.ReactNode; title: string; description: string; accent: string }) {
  const accents: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    brand:  { bg: "bg-brand-500/10",  border: "border-brand-500/20",  text: "text-brand-400",  glow: "group-hover:shadow-glow-sm" },
    indigo: { bg: "bg-accent-indigo/10", border: "border-accent-indigo/20", text: "text-accent-indigo", glow: "group-hover:shadow-glow-indigo" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", glow: "group-hover:shadow-glow-orange" },
  };
  const a = accents[accent] ?? accents.brand;

  return (
    <div className={`group relative rounded-2xl border border-zinc-100 bg-white shadow-sm p-7 h-full card-spotlight card-glow-hover ${a.glow}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} border ${a.border} ${a.text}`}
            whileHover={{ scale: 1.15, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {icon}
          </motion.div>
          <span className="text-xs font-mono text-zinc-600 tracking-wider">{number}</span>
        </div>
        <h3 className="font-display font-bold text-lg text-zinc-900 mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BentoCard({
  icon, title, description, size = "normal", glow = "brand", highlight, badge,
}: {
  icon: React.ReactNode; title: string; description: string;
  size?: "normal" | "large"; glow?: string; highlight?: boolean; badge?: string;
}) {
  const glowBorders: Record<string, string> = {
    brand: "hover:border-brand-500/20",
    orange: "hover:border-accent-orange/20",
    indigo: "hover:border-accent-indigo/20",
    emerald: "hover:border-accent-emerald/20",
  };

  return (
    <div
      className={cn(
        "group relative rounded-2xl border p-6 h-full card-interactive card-spotlight card-shine transition-all",
        size === "large" ? "sm:flex sm:items-start sm:gap-5" : "",
        highlight ? "border-brand-500/20 bg-brand-500/[0.04]" : "border-zinc-100 bg-white shadow-sm",
        glowBorders[glow] ?? "",
      )}
    >
      <div className={cn("shrink-0 mb-4 sm:mb-0", size === "large" ? "" : "")}>
        <motion.div
          className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
        >
          {icon}
        </motion.div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-semibold text-sm text-zinc-900">{title}</h3>
          {badge && (
            <motion.span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 border border-brand-500/20"
              animate={{ boxShadow: ["0 0 0 0 rgba(255,170,0,0)", "0 0 0 4px rgba(255,170,0,0.1)", "0 0 0 0 rgba(255,170,0,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {badge}
            </motion.span>
          )}
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Testimonials Marquee (Magic UI Marquee style) ─── */

const testimonials = [
  {
    quote: "Antes tardabamos 3 horas cada lunes preparando el contenido de los clientes. Ahora subimos el ZIP y listo en 5 minutos.",
    name: "Marina Lopez", role: "Directora Social Media, Agencia Pulso", initials: "ML",
  },
  {
    quote: "La deteccion de carruseles es increible. Ya no tengo que numerar las fotos ni preocuparme por el orden.",
    name: "Diego Sanchez", role: "Content Creator, @diegoviaja", initials: "DS",
  },
  {
    quote: "Gestionamos 12 cuentas. Sin AutoPost no podriamos. El plan Agencia se pago solo el primer mes.",
    name: "Carla Fuentes", role: "CEO, SocialCraft Agency", initials: "CF",
  },
  {
    quote: "El flujo de trabajo es tan simple que lo configure en 5 minutos. Mis clientes estan encantados con la consistencia.",
    name: "Andres Ramirez", role: "Freelance Social Media Manager", initials: "AR",
  },
  {
    quote: "Posts colaborativos automaticos. Eso no lo tiene ningun otro scheduler. Game changer para nuestras campanas.",
    name: "Lucia Mendoza", role: "Growth Lead, BrandUp Studio", initials: "LM",
  },
  {
    quote: "Antes usaba Later y tardaba 2 horas por cuenta. Con AutoPost son 2 minutos literales. No exagero.",
    name: "Pablo Torres", role: "Social Media, @foodie.madrid", initials: "PT",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 section-divider" />
      <div className="px-6">
        <MotionReveal direction="up" blur cinematic>
          <div className="text-center mb-20">
            <motion.p
              className="text-xs font-semibold text-brand-400 uppercase tracking-[0.25em] mb-5"
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
            >
              Testimonios
            </motion.p>
            <MotionText
              as="h2"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
              effect="clip"
              highlight={{ words: ["usan"], className: "text-gradient" }}
            >
              Lo que dicen quienes ya lo usan
            </MotionText>
          </div>
        </MotionReveal>
      </div>

      {/* Marquee with hover pause */}
      <div className="marquee-container">
        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          whileHover={{ animationPlayState: "paused" } as any}
        >
          {[...testimonials, ...testimonials].map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} {...t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({ quote, name, role, initials }: typeof testimonials[0]) {
  return (
    <motion.div
      className="relative w-[340px] shrink-0 rounded-2xl border border-zinc-100 bg-white shadow-sm p-7 flex flex-col gap-5 card-shine"
      whileHover={{ scale: 1.03, y: -4, borderColor: "rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
    >
      <span className="absolute top-4 right-5 text-5xl font-display text-brand-500/8 leading-none select-none" aria-hidden="true">
        &ldquo;
      </span>
      <p className="text-sm text-zinc-600 leading-relaxed relative z-10">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="relative h-9 w-9 rounded-full flex items-center justify-center shrink-0">
          {/* Rotating ring — Aceternity MovingBorder inspired */}
          <div className="absolute inset-[-2px] rounded-full" style={{
            background: "conic-gradient(from 0deg, #FFAA00, #6366F1, #34D399, #FFAA00)",
            animation: "rotateBorder 6s linear infinite",
          }} />
          <div className="absolute inset-0 rounded-full bg-white" />
          <span className="text-xs font-bold text-brand-600 relative z-10">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{name}</p>
          <p className="text-xs text-zinc-500">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Pricing (moved to @/components/landing/pricing-section) ─── */


/* ─── Mouse Gradient (Aceternity Spotlight) ─── */

function MouseGradient({ mouseX, mouseY }: { mouseX: ReturnType<typeof useMotionValue<number>>; mouseY: ReturnType<typeof useMotionValue<number>> }) {
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const background = useTransform(
    [springX, springY] as any,
    ([x, y]: number[]) => `radial-gradient(900px circle at ${x}px ${y}px, rgba(255,170,0,0.06), transparent 55%)`
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[2]"
      style={{ background }}
    />
  );
}
