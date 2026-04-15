import Link from "next/link";
import dynamic from "next/dynamic";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import { StatsStrip } from "@/components/landing/stats-strip";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { TiltCard } from "@/components/landing/tilt-card";
import { CustomCursor } from "@/components/landing/custom-cursor";
import { StickyCTA } from "@/components/landing/sticky-cta";

// Dynamic import for 3D scene — no SSR, loads only on client
const HeroScene = dynamic(() => import("@/components/hero-3d/HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="w-48 h-80 rounded-3xl skeleton opacity-20" />
    </div>
  ),
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-primary text-zinc-100 overflow-hidden">
      {/* Custom cursor (desktop only) */}
      <CustomCursor />

      {/* Sticky CTA (mobile only) */}
      <StickyCTA />

      {/* ═══════════════════════════════════════════════════════════════════
           HERO — cinematic 3D with smartphone + folder scene
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Gradient mesh background (behind 3D) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-surface-primary" />
          {/* Ambient orbs — updated to new palette */}
          <div className="absolute w-[900px] h-[600px] top-[-10%] left-[-15%] rounded-full opacity-30 animate-drift" style={{ background: "radial-gradient(circle, rgba(255,184,0,0.18) 0%, transparent 70%)" }} />
          <div className="absolute w-[700px] h-[700px] bottom-[-20%] right-[-10%] rounded-full opacity-20 animate-drift" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", animationDelay: "4s", animationDirection: "reverse" }} />
          <div className="absolute w-[500px] h-[500px] top-[30%] right-[20%] rounded-full opacity-15 animate-float" style={{ background: "radial-gradient(circle, rgba(6,214,160,0.12) 0%, transparent 70%)", animationDelay: "2s" }} />
          {/* Noise texture */}
          <div className="absolute inset-0 noise opacity-40" />
          {/* Vignette */}
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(11,17,32,0.6) 100%)" }} />
        </div>

        {/* 3D Scene (absolute, behind text) */}
        <HeroScene />

        {/* ─── Navbar ─── */}
        <nav className="relative z-20 w-full px-6 sm:px-8 pt-5 pb-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-violet/10 border border-brand-500/25">
                <Zap className="h-4 w-4 text-brand-400" aria-hidden="true" />
                <div className="absolute inset-0 rounded-lg bg-brand-500/10 animate-glow-pulse" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                Auto<span className="text-gradient">Post</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-5">
              <a href="#como-funciona" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Como funciona
              </a>
              <a href="#precios" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
                Precios
              </a>
              <a href="/demo" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
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
                className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-brand-vivid text-white shadow-glow-sm hover:shadow-glow transition-all btn-ripple"
              >
                Empezar gratis
              </Link>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </nav>

        {/* ─── Hero content — split layout on desktop ─── */}
        <div className="relative z-10 flex-1 flex items-center px-6">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[55%_45%] gap-8 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              {/* Category badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/[0.06] text-xs font-medium text-brand-300 mb-8 animate-fade-up backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Automatizacion de Instagram para agencias
              </div>

              {/* Large headline */}
              <h1 className="font-headline font-semibold tracking-[-0.03em] leading-[0.95] mb-6 animate-fade-up stagger-1">
                <span className="block text-zinc-100 text-[clamp(2.5rem,7vw,5.5rem)]">
                  Un mes de
                </span>
                <span
                  className="block text-[clamp(3rem,9vw,7rem)]"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #FFD040 0%, #7C3AED 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Instagram
                </span>
                <span className="block text-zinc-100 text-[clamp(2.5rem,7vw,5.5rem)]">
                  en 2 minutos
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0 mb-4 animate-fade-up stagger-2">
                Arrastra tu carpeta.{" "}
                <span className="text-zinc-200">AutoPost detecta carruseles, extrae los copies y programa 30 dias.</span>
              </p>

              {/* Speed proof */}
              <p className="text-sm text-accent-slate mb-8 animate-fade-up stagger-2">
                <span className="text-red-400/80 font-semibold">90x mas rapido</span>
                {" "}que hacerlo a mano
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 animate-fade-up stagger-3">
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-sm shadow-glow hover:shadow-glow-lg hover:scale-[1.02] transition-all duration-200 btn-ripple"
                >
                  Programar mi primer mes — Gratis
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium px-6 py-4 text-sm rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  Ver como funciona
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <p className="text-xs text-accent-slate/70 mt-5 animate-fade-up stagger-4">
                Sin tarjeta de credito · Cancela cuando quieras
              </p>
            </div>

            {/* Right: 3D scene occupies this space (rendered as absolute overlay) */}
            <div className="hidden lg:block h-[500px]" aria-hidden="true" />
          </div>
        </div>

        {/* ─── Trust bar (bottom of hero) ─── */}
        <div className="relative z-10 pb-8 pt-4">
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <div className="flex items-center gap-2 text-xs text-accent-slate">
                <Shield className="h-3.5 w-3.5 text-brand-400/70" aria-hidden="true" />
                <span>API oficial de Meta</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-accent-slate">
                <Lock className="h-3.5 w-3.5 text-brand-400/70" aria-hidden="true" />
                <span>Cifrado AES-256</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-accent-slate">
                <Instagram className="h-3.5 w-3.5 text-brand-400/70" aria-hidden="true" />
                <span>Fotos, reels y carruseles</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-accent-slate">
                <Users className="h-3.5 w-3.5 text-brand-400/70" aria-hidden="true" />
                <span>Posts colaborativos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/15 to-transparent" />
      </section>

      {/* ─── Stats strip ─── */}
      <StatsStrip />

      {/* ─── How it works ─── */}
      <section id="como-funciona" className="py-28 px-6 relative">
        <div className="aurora w-[500px] h-[300px] bg-accent-violet/[0.04] bottom-20 right-0" style={{ animationDelay: "6s" }} />

        <div className="max-w-5xl mx-auto relative">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
                Como funciona
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                Tres pasos. <span className="text-gradient">Cero complicaciones.</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal stagger>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TiltCard>
                <StepCard
                  number="01"
                  icon={<Upload className="h-5 w-5" />}
                  title="Arrastra tu carpeta (o ZIP)"
                  description="Sube tu carpeta o ZIP con fotos, videos y textos. No importa como lo organices — AutoPost lo entiende."
                  accent="brand"
                />
              </TiltCard>
              <TiltCard>
                <StepCard
                  number="02"
                  icon={<Layers className="h-5 w-5" />}
                  title="Revision automatica"
                  description="AutoPost detecta carruseles, empareja fotos con textos y te muestra todo para que lo revises."
                  accent="violet"
                />
              </TiltCard>
              <TiltCard>
                <StepCard
                  number="03"
                  icon={<Calendar className="h-5 w-5" />}
                  title="Programa y olvida"
                  description="Elige horario y frecuencia. AutoPost publica automaticamente durante los proximos 30 dias."
                  accent="orange"
                />
              </TiltCard>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── Differentiation block ─── */}
      <section className="py-16 px-6">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-brand-500/15 bg-surface-card overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
                {/* Before */}
                <div className="p-8 space-y-4">
                  <p className="text-xs font-semibold text-accent-slate uppercase tracking-[0.15em]">Como lo haces hoy</p>
                  {[
                    "Subir cada foto una a una",
                    "Copiar y pegar cada caption manualmente",
                    "Arrastrar y soltar para ordenar el carrusel",
                    "Configurar la fecha de cada post por separado",
                    "2-3 horas de trabajo por cliente",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 h-4 w-4 rounded-full border border-red-500/30 bg-red-500/10 flex items-center justify-center shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
                      </span>
                      <p className="text-sm text-accent-slate leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
                {/* After */}
                <div className="p-8 space-y-4 bg-brand-500/[0.03]">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.15em]">Como sera con AutoPost</p>
                  {[
                    "Subir una carpeta o ZIP con todo",
                    "Copy extraido automaticamente del .txt",
                    "Carruseles detectados sin numerar fotos",
                    "30 dias de programacion en una sola configuracion",
                    "2 minutos por cliente",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 text-brand-400 shrink-0" aria-hidden="true" />
                      <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Features ─── */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
                Caracteristicas
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                Disenado para hacer mucho <span className="text-gradient">en poco tiempo</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal stagger>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<Layers className="h-5 w-5 text-brand-400" />}
                  title="Deteccion de carruseles"
                  description="Detecta automaticamente cuando varias fotos forman un carrusel. Sin numerarlas manualmente."
                  glow="brand"
                />
              </TiltCard>
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<CheckCircle className="h-5 w-5 text-accent-orange" />}
                  title="Extraccion de copy"
                  description="Lee archivos de texto y los asocia a cada post automaticamente. Cero copia y pega."
                  glow="orange"
                />
              </TiltCard>
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<Clock className="h-5 w-5 text-accent-violet" />}
                  title="Programacion inteligente"
                  description="Configura frecuencia, dias y horario. El calendario se ajusta solo a 30 dias vista."
                  glow="brand"
                />
              </TiltCard>
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<Shield className="h-5 w-5 text-accent-cyan" />}
                  title="Conexion segura Meta API"
                  description="OAuth oficial de Meta. Tu contrasena nunca se comparte ni se almacena jamas."
                  glow="orange"
                />
              </TiltCard>
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<Instagram className="h-5 w-5 text-brand-400" />}
                  title="Fotos, videos y reels"
                  description="Soporta JPG, PNG, WEBP, MP4 y MOV. Hasta 100 MB por archivo."
                  glow="brand"
                />
              </TiltCard>
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<Calendar className="h-5 w-5 text-accent-violet" />}
                  title="Vista previa completa"
                  description="Ve exactamente que se publicara y cuando antes de confirmar. Sin sorpresas."
                  glow="orange"
                />
              </TiltCard>
              <TiltCard className="h-full">
                <FeatureCard
                  icon={<Users className="h-5 w-5 text-accent-cyan" />}
                  title="Posts colaborativos"
                  description="Aparece en dos feeds a la vez. Sin coordinacion manual — doble audiencia, un solo post."
                  glow="brand"
                  highlight
                />
              </TiltCard>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── ROI Calculator ─── */}
      <ScrollReveal>
        <ROICalculator />
      </ScrollReveal>

      {/* ─── Testimonials ─── */}
      <TestimonialsSection />

      {/* ─── Pricing ─── */}
      <PricingSection />

      {/* ─── FAQ ─── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
                Preguntas frecuentes
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
                Todo claro antes de <span className="text-gradient">empezar</span>
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <FAQAccordion />
          </ScrollReveal>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="py-28 px-6 relative">
        <div className="aurora w-[600px] h-[350px] bg-brand-500/[0.07] top-0 left-1/2 -translate-x-1/2" style={{ animationDelay: "2s" }} />
        <div className="aurora w-[400px] h-[250px] bg-accent-violet/[0.04] top-10 right-1/4" style={{ animationDelay: "5s" }} />

        <ScrollReveal>
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="rounded-3xl border border-brand-500/20 bg-surface-card p-12 sm:p-16 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-accent-violet/[0.04] pointer-events-none" />
              <div className="relative">
                <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
                  Tu proximo mes de contenido, <span className="text-gradient">listo en 2 minutos</span>
                </h2>
                <p className="text-lg text-zinc-400 mb-10 max-w-md mx-auto">
                  Programa todo el mes de una vez y dedica tu tiempo a lo que importa.
                </p>
                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-base shadow-glow hover:shadow-glow-lg hover:scale-[1.03] transition-all duration-200 btn-ripple"
                >
                  Empezar gratis — primera carpeta incluida
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <p className="text-sm text-accent-slate mt-4">
                  Sin tarjeta de credito. Sin compromisos.
                </p>

                <div className="mt-8 pt-6 border-t border-white/[0.04]">
                  <p className="text-xs text-accent-slate italic">
                    &ldquo;Lo que Later tarda 2 horas, AutoPost lo hace en{" "}
                    <span className="text-zinc-400 not-italic font-semibold">2 minutos</span>&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/15">
              <Zap className="h-3 w-3 text-brand-400" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-sm">AutoPost</span>
          </div>
          <p className="text-xs text-accent-slate">
            Hecho para agencias e influencers hispanohablantes
          </p>
          <div className="flex items-center gap-5 text-xs text-accent-slate">
            <a href="/privacidad" className="hover:text-zinc-400 transition-colors">
              Politica de privacidad
            </a>
            <a href="/terminos" className="hover:text-zinc-400 transition-colors">
              Terminos de uso
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Subcomponents ─── */

function StepCard({
  number,
  icon,
  title,
  description,
  accent,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  const accents: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    brand:  { bg: "bg-brand-500/10",  border: "border-brand-500/20",  text: "text-brand-400",  glow: "group-hover:shadow-glow-sm" },
    violet: { bg: "bg-accent-violet/10", border: "border-accent-violet/20", text: "text-accent-violet", glow: "group-hover:shadow-glow-violet" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", glow: "group-hover:shadow-glow-orange" },
    cyan:   { bg: "bg-accent-cyan/10",   border: "border-accent-cyan/20",   text: "text-accent-cyan",   glow: "group-hover:shadow-glow-cyan" },
  };
  const a = accents[accent] ?? accents.brand;

  return (
    <div className={`group relative rounded-2xl border border-white/[0.06] bg-surface-card p-7 h-full ${a.glow}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} border ${a.border} ${a.text}`}>
            {icon}
          </div>
          <span className="text-xs font-mono text-accent-slate tracking-wider">{number}</span>
        </div>
        <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  glow,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  glow: string;
  highlight?: boolean;
}) {
  const glowColors: Record<string, string> = {
    brand:  "group-hover:border-brand-500/20",
    orange: "group-hover:border-accent-orange/20",
  };

  return (
    <div
      className={cn(
        "group flex gap-4 rounded-xl border p-5 h-full",
        glowColors[glow] ?? "",
        highlight
          ? "border-brand-500/20 bg-brand-500/[0.04]"
          : "border-white/[0.05] bg-surface-card/60"
      )}
    >
      <div className="mt-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-semibold text-sm text-white">{title}</h3>
          {highlight && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/20">
              Unico
            </span>
          )}
        </div>
        <p className="text-sm text-accent-slate leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Testimonials ─── */

const testimonials = [
  {
    quote: "Antes tardabamos 3 horas cada lunes preparando el contenido de los clientes. Ahora subimos el ZIP y listo en 5 minutos. AutoPost lo organiza todo.",
    name: "Marina Lopez",
    role: "Directora de Social Media, Agencia Pulso",
    initials: "ML",
  },
  {
    quote: "La deteccion de carruseles es increible. Ya no tengo que numerar las fotos ni preocuparme por el orden. Subo la carpeta y AutoPost lo hace perfecto.",
    name: "Diego Sanchez",
    role: "Content Creator, @diegoviaja",
    initials: "DS",
  },
  {
    quote: "Gestionamos 12 cuentas para clientes. Sin AutoPost no podriamos. El plan Agencia se pago solo el primer mes con el tiempo que nos ahorro.",
    name: "Carla Fuentes",
    role: "CEO, SocialCraft Agency",
    initials: "CF",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-28 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Testimonios
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Lo que dicen <span className="text-gradient">quienes ya lo usan</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TiltCard key={t.name}>
                <TestimonialCard {...t} />
              </TiltCard>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  initials,
}: {
  quote: string;
  name: string;
  role: string;
  initials: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-surface-elevated p-7 flex flex-col gap-5 h-full">
      <span className="absolute top-4 right-5 text-6xl font-display text-brand-500/10 leading-none select-none" aria-hidden="true">
        &ldquo;
      </span>
      <p className="text-sm text-zinc-300 leading-relaxed relative z-10">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-violet/15 border border-brand-500/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand-300">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-accent-slate">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing ─── */

const pricingTiers = [
  {
    name: "Free",
    priceLabel: "Gratis",
    description: "Para empezar sin compromiso",
    features: [
      "1 cuenta de Instagram",
      "30 posts por mes",
      "Deteccion automatica de carruseles",
      "Extraccion de copy desde .txt",
      "Publicacion automatica via API oficial",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    priceLabel: "$19/mes",
    description: "Para creadores y freelancers",
    features: [
      "5 cuentas de Instagram",
      "Posts ilimitados",
      "Posts colaborativos (Collabs)",
      "Flujo de aprobacion de contenido",
      "Soporte prioritario por email",
    ],
    cta: "Empezar con Pro",
    popular: true,
  },
  {
    name: "Agency",
    priceLabel: "$49/mes",
    description: "Para agencias y equipos",
    features: [
      "Cuentas ilimitadas",
      "Todo lo del plan Pro",
      "Panel multi-cliente",
      "Logs de auditoria completos",
      "Soporte directo prioritario",
    ],
    cta: "Empezar con Agency",
    popular: false,
  },
];

function PricingSection() {
  return (
    <section id="precios" className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Precios
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Simple y <span className="text-gradient">sin sorpresas</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal stagger>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingTiers.map((tier) => (
              <TiltCard key={tier.name}>
                <PricingCard tier={tier} />
              </TiltCard>
            ))}
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
          <div className="flex items-center gap-1.5 text-xs text-accent-slate">
            <Shield className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
            Conexion oficial Meta API
          </div>
          <div className="flex items-center gap-1.5 text-xs text-accent-slate">
            <Lock className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
            Cifrado AES-256
          </div>
          <div className="flex items-center gap-1.5 text-xs text-accent-slate">
            <CheckCircle className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
            Cancela cuando quieras
          </div>
        </div>
        <p className="text-center text-xs text-accent-slate mt-4">
          Sin tarjeta de credito en el plan Free
        </p>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: typeof pricingTiers[0] }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-7 flex flex-col gap-6 h-full",
        tier.popular
          ? "border-brand-500/30 bg-brand-500/[0.05] shadow-glow-sm"
          : "border-white/[0.06] bg-surface-card"
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-brand-magic text-white shadow-glow-sm whitespace-nowrap">
            Mas popular
          </span>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-accent-slate uppercase tracking-wider mb-1">{tier.name}</p>
        <p className="font-display font-extrabold text-3xl text-white">{tier.priceLabel}</p>
        <p className="text-sm text-accent-slate mt-1">{tier.description}</p>
      </div>

      <ul className="space-y-2.5 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <CheckCircle className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 btn-ripple",
          tier.popular
            ? "bg-gradient-brand-vivid text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02]"
            : "border border-white/[0.1] text-zinc-300 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.04]"
        )}
      >
        {tier.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
