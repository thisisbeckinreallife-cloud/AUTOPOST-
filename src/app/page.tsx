"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
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
  X,
  ChevronDown,
  Eye,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
  MotionCounter,
  MotionText,
  MotionParallax,
  EASE_OUT_EXPO,
  SPRING_BOUNCE,
  DURATION,
  STAGGER,
} from "@/components/motion";

// Dynamic import for 3D scene
const HeroScene = dynamic(() => import("@/components/hero-3d/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="w-48 h-80 rounded-3xl skeleton opacity-20" />
    </div>
  ),
});

/* ═══════════════════════════════════════════════════════════════════
   HERO SEQUENCE TIMINGS
   ═══════════════════════════════════════════════════════════════════ */
const SEQ = {
  navbar: 0,
  badge: 0.2,
  headline: 0.4,
  subtitle: 0.8,
  ctas: 1.0,
  trust: 1.2,
  scene: 1.5,
};

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 100);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-surface-primary text-zinc-100 overflow-hidden" onMouseMove={handleMouseMove}>
      <CustomCursor />
      <StickyCTA />
      <ScrollProgress />

      {/* ═══════════════════════════════════════════════════════════════════
           HERO
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-surface-primary" />
          {/* Orbs — larger, with rotation */}
          <motion.div
            className="absolute w-[1000px] h-[700px] top-[-15%] left-[-15%] rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, rgba(255,170,0,0.18) 0%, transparent 65%)" }}
            animate={{ rotate: [0, 5, 0, -3, 0], x: [0, 15, -10, 5, 0], y: [0, -10, 5, -5, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[800px] h-[800px] bottom-[-25%] right-[-10%] rounded-full opacity-18"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)" }}
            animate={{ rotate: [0, -3, 0, 5, 0], x: [0, -10, 15, -5, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[600px] h-[600px] top-[25%] right-[15%] rounded-full opacity-12"
            style={{ background: "radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 65%)" }}
            animate={{ y: [0, -20, 0, 15, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Noise */}
          <div className="absolute inset-0 noise opacity-35" />
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(6,8,13,0.7) 100%)" }} />
        </div>

        {/* Mouse-following gradient */}
        <MouseGradient mouseX={mouseX} mouseY={mouseY} />

        {/* 3D Scene */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: SEQ.scene }}
        >
          <HeroScene />
        </motion.div>

        {/* ─── Navbar ─── */}
        <motion.nav
          className={cn(
            "fixed top-0 left-0 right-0 z-50 w-full px-6 sm:px-8 py-5 transition-all duration-500",
            navScrolled && "navbar-scrolled"
          )}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: SEQ.navbar }}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-indigo/10 border border-brand-500/25">
                <Zap className="h-4 w-4 text-brand-400" aria-hidden="true" />
                <div className="absolute inset-0 rounded-lg bg-brand-500/10 animate-glow-pulse" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                Auto<span className="text-gradient">Post</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#como-funciona" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors link-underline">
                Como funciona
              </a>
              <a href="#precios" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors link-underline">
                Precios
              </a>
              <a href="/demo" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors link-underline">
                Demo
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Iniciar sesion
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-brand-vivid text-white shadow-glow-sm hover:shadow-glow transition-all btn-glow btn-ripple"
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* ─── Hero content ─── */}
        <div className="relative z-10 flex-1 flex items-center px-6 pt-20">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 items-center">
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/[0.06] text-xs font-medium text-brand-300 mb-8 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, delay: SEQ.badge, ease: [0.16, 1, 0.3, 1] }}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Automatizacion de Instagram para agencias
              </motion.div>

              {/* Headline */}
              <MotionText
                as="h1"
                className="font-display font-extrabold tracking-[-0.03em] leading-[0.92] mb-6 text-[clamp(2.5rem,7vw,5.5rem)]"
                delay={SEQ.headline}
                stagger={0.08}
                highlight={{ words: ["Instagram"], className: "text-shimmer" }}
              >
                Un mes de Instagram en 2 minutos
              </MotionText>

              {/* Subtitle */}
              <motion.p
                className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.normal, delay: SEQ.subtitle, ease: [0.16, 1, 0.3, 1] }}
              >
                Arrastra tu carpeta.{" "}
                <span className="text-zinc-200">AutoPost detecta carruseles, extrae los copies y programa 30 dias.</span>
              </motion.p>

              <motion.p
                className="text-sm text-zinc-500 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: SEQ.subtitle + 0.1 }}
              >
                <span className="text-accent-coral font-semibold">90x mas rapido</span>
                {" "}que hacerlo a mano
              </motion.p>

              {/* CTAs */}
              <motion.div
                className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING_BOUNCE, delay: SEQ.ctas }}
              >
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-sm shadow-glow btn-glow btn-ripple"
                >
                  Programar mi primer mes — Gratis
                  <motion.span
                    className="inline-block"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.span>
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium px-6 py-4 text-sm rounded-xl border border-white/[0.06] hover:border-white/[0.14] transition-all duration-200"
                >
                  Ver como funciona
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </motion.div>

              <motion.p
                className="text-xs text-zinc-600 mt-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: SEQ.ctas + 0.2 }}
              >
                Sin tarjeta de credito · Cancela cuando quieras
              </motion.p>
            </div>

            <div className="hidden lg:block h-[500px]" aria-hidden="true" />
          </div>
        </div>

        {/* ─── Trust bar ─── */}
        <motion.div
          className="relative z-10 pb-8 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: SEQ.trust }}
        >
          <div className="max-w-3xl mx-auto px-6">
            <MotionStagger stagger={0.1} delay={SEQ.trust} className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { icon: Shield, label: "API oficial de Meta" },
                { icon: Lock, label: "Cifrado AES-256" },
                { icon: Instagram, label: "Fotos, reels y carruseles" },
                { icon: Users, label: "Posts colaborativos" },
              ].map(({ icon: Icon, label }) => (
                <MotionStaggerItem key={label}>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Icon className="h-3.5 w-3.5 text-brand-500/60" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/15 to-transparent" />
      </section>

      {/* ─── Stats strip ─── */}
      <StatsStrip />

      {/* ═══════════════════════════════════════════════════════════════════
           HOW IT WORKS
           ═══════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="py-28 px-6 relative">
        <div className="aurora w-[500px] h-[300px] bg-accent-indigo/[0.04] bottom-20 right-0" style={{ animationDelay: "6s" }} />

        <div className="max-w-5xl mx-auto relative">
          <MotionReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
                Como funciona
              </p>
              <MotionText
                as="h2"
                className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
                highlight={{ words: ["Cero"], className: "text-gradient" }}
              >
                Tres pasos. Cero complicaciones.
              </MotionText>
            </div>
          </MotionReveal>

          {/* SVG connecting line (desktop) */}
          <div className="hidden md:block absolute top-[58%] left-[17%] right-[17%] h-[2px] -translate-y-1/2 pointer-events-none">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(255,170,0,0.2), rgba(99,102,241,0.2), rgba(251,146,60,0.2))" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>

          <MotionStagger stagger={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              { number: "01", icon: Upload, title: "Arrastra tu carpeta (o ZIP)", desc: "Sube tu carpeta o ZIP con fotos, videos y textos. No importa como lo organices — AutoPost lo entiende.", accent: "brand" },
              { number: "02", icon: Layers, title: "Revision automatica", desc: "AutoPost detecta carruseles, empareja fotos con textos y te muestra todo para que lo revises.", accent: "indigo" },
              { number: "03", icon: Calendar, title: "Programa y olvida", desc: "Elige horario y frecuencia. AutoPost publica automaticamente durante los proximos 30 dias.", accent: "orange" },
            ].map(({ number, icon: Icon, title, desc, accent }) => (
              <MotionStaggerItem key={number}>
                <TiltCard>
                  <StepCard number={number} icon={<Icon className="h-5 w-5" />} title={title} description={desc} accent={accent} />
                </TiltCard>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>
      </section>

      {/* ─── Product Demo ─── */}
      <ProductDemo />

      {/* ═══════════════════════════════════════════════════════════════════
           BEFORE / AFTER
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <MotionReveal>
            <div className="rounded-2xl border border-brand-500/15 bg-surface-card overflow-hidden relative">
              {/* Center badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:flex">
                <motion.div
                  className="px-4 py-2 rounded-full bg-surface-primary border border-brand-500/30 text-xs font-bold text-brand-400 shadow-glow-sm"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={SPRING_BOUNCE}
                >
                  2h → 2min
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
                {/* Before */}
                <div className="p-8 space-y-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.15em]">Como lo haces hoy</p>
                  <MotionStagger stagger={0.08}>
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
                          <p className="text-sm text-zinc-500 leading-relaxed line-through decoration-zinc-700">{item}</p>
                        </div>
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                </div>
                {/* After */}
                <div className="p-8 space-y-4 bg-brand-500/[0.03]">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.15em]">Como sera con AutoPost</p>
                  <MotionStagger stagger={0.08}>
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
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ ...SPRING_BOUNCE, delay: 0.2 }}
                          >
                            <CheckCircle className="mt-0.5 h-4 w-4 text-brand-400 shrink-0" aria-hidden="true" />
                          </motion.div>
                          <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
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
           FEATURES — BENTO GRID
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.015] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <MotionReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
                Caracteristicas
              </p>
              <MotionText
                as="h2"
                className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
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

            {/* Highlight card — spans 2 cols */}
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

      {/* ─── ROI Calculator ─── */}
      <MotionReveal>
        <ROICalculator />
      </MotionReveal>

      {/* ─── Comparison Table ─── */}
      <ComparisonTable />

      {/* ═══════════════════════════════════════════════════════════════════
           TESTIMONIALS — MARQUEE
           ═══════════════════════════════════════════════════════════════════ */}
      <TestimonialsSection />

      {/* ═══════════════════════════════════════════════════════════════════
           PRICING
           ═══════════════════════════════════════════════════════════════════ */}
      <PricingSection isAnnual={isAnnual} onToggleAnnual={() => setIsAnnual(!isAnnual)} />

      {/* ─── FAQ ─── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <MotionReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
                Preguntas frecuentes
              </p>
              <MotionText
                as="h2"
                className="font-display font-bold text-3xl sm:text-4xl tracking-tight"
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
           FINAL CTA — with magnetic button
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 relative">
        <div className="aurora w-[700px] h-[400px] bg-brand-500/[0.06] top-0 left-1/2 -translate-x-1/2" style={{ animationDelay: "2s" }} />
        <div className="aurora w-[500px] h-[300px] bg-accent-indigo/[0.04] top-10 right-1/4" style={{ animationDelay: "5s" }} />

        <MotionReveal>
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="rounded-3xl border border-brand-500/20 bg-surface-card p-12 sm:p-16 relative overflow-hidden border-rotating">
              <div className="absolute inset-[1px] rounded-3xl bg-surface-card" />
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-accent-indigo/[0.04] pointer-events-none rounded-3xl" />
              <div className="relative">
                <MotionText
                  as="h2"
                  className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
                  highlight={{ words: ["2", "minutos"], className: "text-gradient" }}
                >
                  Tu proximo mes de contenido listo en 2 minutos
                </MotionText>
                <p className="text-lg text-zinc-400 mb-10 max-w-md mx-auto">
                  Programa todo el mes de una vez y dedica tu tiempo a lo que importa.
                </p>
                <MagneticButton>
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-base shadow-glow btn-glow btn-ripple"
                  >
                    Empezar gratis — primera carpeta incluida
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </MagneticButton>
                <p className="text-sm text-zinc-500 mt-4">
                  Sin tarjeta de credito. Sin compromisos.
                </p>
              </div>
            </div>
          </div>
        </MotionReveal>
      </section>

      {/* ─── Footer ─── */}
      <MotionReveal>
        <footer className="border-t border-white/[0.04] py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/15">
                <Zap className="h-3 w-3 text-brand-400" aria-hidden="true" />
              </div>
              <span className="font-display font-bold text-sm">AutoPost</span>
            </div>
            <p className="text-xs text-zinc-600">
              Hecho para agencias e influencers hispanohablantes
            </p>
            <div className="flex items-center gap-5 text-xs text-zinc-500">
              <a href="/privacidad" className="hover:text-zinc-300 transition-colors link-underline">
                Politica de privacidad
              </a>
              <a href="/terminos" className="hover:text-zinc-300 transition-colors link-underline">
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
    <div className={`group relative rounded-2xl border border-white/[0.06] bg-surface-card p-7 h-full card-spotlight ${a.glow}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} border ${a.border} ${a.text}`}
            whileHover={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.div>
          <span className="text-xs font-mono text-zinc-600 tracking-wider">{number}</span>
        </div>
        <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
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
        "group relative rounded-2xl border p-6 h-full card-interactive card-spotlight transition-all",
        size === "large" ? "sm:flex sm:items-start sm:gap-5" : "",
        highlight ? "border-brand-500/20 bg-brand-500/[0.04]" : "border-white/[0.05] bg-surface-card/80",
        glowBorders[glow] ?? "",
      )}
    >
      <div className={cn("shrink-0 mb-4 sm:mb-0", size === "large" ? "" : "")}>
        <motion.div
          className="opacity-80 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-semibold text-sm text-white">{title}</h3>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/20">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Testimonials Marquee ─── */

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
    <section className="py-28 relative overflow-hidden">
      <div className="px-6">
        <MotionReveal>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Testimonios
            </p>
            <MotionText
              as="h2"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
              highlight={{ words: ["usan"], className: "text-gradient" }}
            >
              Lo que dicen quienes ya lo usan
            </MotionText>
          </div>
        </MotionReveal>
      </div>

      {/* Marquee */}
      <div className="marquee-container">
        <motion.div
          className="flex gap-6 w-max hover:[animation-play-state:paused]"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
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
    <div className="relative w-[340px] shrink-0 rounded-2xl border border-white/[0.06] bg-surface-card p-7 flex flex-col gap-5 hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 hover:border-white/[0.1]">
      <span className="absolute top-4 right-5 text-5xl font-display text-brand-500/8 leading-none select-none" aria-hidden="true">
        &ldquo;
      </span>
      <p className="text-sm text-zinc-300 leading-relaxed relative z-10">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="relative h-9 w-9 rounded-full flex items-center justify-center shrink-0">
          {/* Rotating ring */}
          <div className="absolute inset-[-2px] rounded-full" style={{
            background: "conic-gradient(from 0deg, #FFAA00, #6366F1, #34D399, #FFAA00)",
            animation: "rotateBorder 8s linear infinite",
          }} />
          <div className="absolute inset-0 rounded-full bg-surface-card" />
          <span className="text-xs font-bold text-brand-300 relative z-10">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing ─── */

const pricingTiers = [
  {
    name: "Free", price: 0, priceLabel: "Gratis", description: "Para empezar sin compromiso",
    features: ["1 cuenta de Instagram", "30 posts por mes", "Deteccion de carruseles", "Extraccion de copy", "Publicacion via API oficial"],
    cta: "Empezar gratis", popular: false,
  },
  {
    name: "Pro", price: 19, priceLabel: "$19/mes", description: "Para creadores y freelancers",
    features: ["5 cuentas de Instagram", "Posts ilimitados", "Posts colaborativos (Collabs)", "Flujo de aprobacion", "Soporte prioritario"],
    cta: "Empezar con Pro", popular: true,
  },
  {
    name: "Agency", price: 49, priceLabel: "$49/mes", description: "Para agencias y equipos",
    features: ["Cuentas ilimitadas", "Todo lo del plan Pro", "Panel multi-cliente", "Logs de auditoria", "Soporte directo prioritario"],
    cta: "Empezar con Agency", popular: false,
  },
];

function PricingSection({ isAnnual, onToggleAnnual }: { isAnnual: boolean; onToggleAnnual: () => void }) {
  return (
    <section id="precios" className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.015] to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <MotionReveal>
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Precios
            </p>
            <MotionText
              as="h2"
              className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight"
              highlight={{ words: ["sorpresas"], className: "text-gradient" }}
            >
              Simple y sin sorpresas
            </MotionText>
          </div>
        </MotionReveal>

        <PricingToggle isAnnual={isAnnual} onToggle={onToggleAnnual} />

        <MotionStagger stagger={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {pricingTiers.map((tier) => (
            <MotionStaggerItem key={tier.name}>
              <TiltCard>
                <PricingCard tier={tier} isAnnual={isAnnual} />
              </TiltCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        <MotionReveal delay={0.4}>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {[
              { icon: Shield, label: "Conexion oficial Meta API" },
              { icon: Lock, label: "Cifrado AES-256" },
              { icon: CheckCircle, label: "Cancela cuando quieras" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Icon className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
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

function PricingCard({ tier, isAnnual }: { tier: typeof pricingTiers[0]; isAnnual: boolean }) {
  const annualPrice = tier.price > 0 ? Math.round(tier.price * 0.8) : 0;
  const displayPrice = isAnnual && tier.price > 0 ? `$${annualPrice}` : tier.price === 0 ? "Gratis" : `$${tier.price}`;

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-7 flex flex-col gap-6 h-full",
        tier.popular
          ? "border-transparent bg-surface-card border-rotating"
          : "border-white/[0.06] bg-surface-card"
      )}
    >
      {tier.popular && <div className="absolute inset-[1.5px] rounded-2xl bg-surface-card z-0" />}

      <div className="relative z-10">
        {tier.popular && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2">
            <motion.span
              className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-brand-magic text-white shadow-glow-sm whitespace-nowrap"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={SPRING_BOUNCE}
            >
              Mas popular
            </motion.span>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{tier.name}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-display font-extrabold text-4xl text-white">{displayPrice}</p>
            {tier.price > 0 && (
              <span className="text-sm text-zinc-500">/{isAnnual ? "mes" : "mes"}</span>
            )}
          </div>
          {isAnnual && tier.price > 0 && (
            <p className="text-xs text-zinc-600 mt-1 line-through">${tier.price}/mes</p>
          )}
          <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>
        </div>

        <ul className="space-y-2.5 flex-1 mb-6">
          {tier.features.map((f, i) => (
            <motion.li
              key={f}
              className="flex items-start gap-2.5 text-sm text-zinc-300"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <CheckCircle className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" aria-hidden="true" />
              {f}
            </motion.li>
          ))}
        </ul>

        <Link
          href="/signup"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 btn-ripple w-full",
            tier.popular
              ? "bg-gradient-brand-vivid text-white shadow-glow btn-glow"
              : "border border-white/[0.1] text-zinc-300 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.04]"
          )}
        >
          {tier.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─── Mouse Gradient ─── */

function MouseGradient({ mouseX, mouseY }: { mouseX: ReturnType<typeof useMotionValue<number>>; mouseY: ReturnType<typeof useMotionValue<number>> }) {
  const background = useTransform(
    [mouseX, mouseY] as any,
    ([x, y]: number[]) => `radial-gradient(800px circle at ${x}px ${y}px, rgba(255,170,0,0.04), transparent 60%)`
  );

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-[2]"
      style={{ background }}
    />
  );
}

/* ─── Magnetic Button ─── */

function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
