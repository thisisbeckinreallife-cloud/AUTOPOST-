import Link from "next/link";
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
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import { StatsStrip } from "@/components/landing/stats-strip";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { HeroVideo } from "@/components/landing/hero-video";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-primary text-zinc-100 overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════
           CINEMATIC HERO — full-screen video + oversized headline
           ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background video */}
        <HeroVideo />

        {/* Blurred overlay shape */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 pointer-events-none"
          style={{ filter: "blur(82px)" }}
        />

        {/* ─── Navbar ─── */}
        <nav className="relative z-10 w-full py-5 px-8">
          <div className="flex items-center justify-between">
            {/* Left: logo */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-orange/10 border border-brand-500/25">
                <Zap className="h-4 w-4 text-brand-400" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight">
                Auto<span className="text-gradient">Post</span>
              </span>
            </div>

            {/* Center: nav links */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#como-funciona" className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-100/90 hover:text-white transition-colors rounded-lg">
                Funciones
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </a>
              <a href="#como-funciona" className="px-3 py-2 text-sm text-zinc-100/90 hover:text-white transition-colors rounded-lg">
                Soluciones
              </a>
              <a href="#precios" className="px-3 py-2 text-sm text-zinc-100/90 hover:text-white transition-colors rounded-lg">
                Precios
              </a>
              <a href="#faq" className="flex items-center gap-1 px-3 py-2 text-sm text-zinc-100/90 hover:text-white transition-colors rounded-lg">
                Recursos
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </a>
            </div>

            {/* Right: CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline text-sm font-medium px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold px-4 py-2 rounded-full bg-gradient-brand-vivid text-white shadow-glow-sm hover:shadow-glow transition-all"
              >
                Empezar gratis
              </Link>
            </div>
          </div>

          {/* Navbar divider */}
          <div className="mt-[3px] h-px bg-gradient-to-r from-transparent via-zinc-100/20 to-transparent" />
        </nav>

        {/* ─── Hero content ─── */}
        <div className="relative z-10 flex-1 flex items-center justify-center overflow-visible">
          {/* Centered blur behind text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[984px] h-[527px] opacity-90 bg-gray-950 pointer-events-none" style={{ filter: "blur(82px)" }} />

          <div className="text-center px-6 max-w-6xl mx-auto">
            {/* Oversized headline */}
            <h1 className="font-headline font-normal tracking-[-0.024em] leading-[1.02] animate-fade-up">
              <span className="block text-zinc-100 text-6xl sm:text-8xl md:text-9xl lg:text-[160px] xl:text-[200px]">
                Programa
              </span>
              <span
                className="block text-6xl sm:text-8xl md:text-9xl lg:text-[160px] xl:text-[200px]"
                style={{
                  backgroundImage: "linear-gradient(to left, #3B82F6, #FB923C, #FBBF24)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Instagram
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-300/80 text-lg leading-8 max-w-md mx-auto mt-[9px] animate-fade-up stagger-1">
              Sube una carpeta. AutoPost programa<br />
              30 días de contenido en 2 minutos.
            </p>

            {/* CTA */}
            <div className="mt-[25px] animate-fade-up stagger-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-[29px] py-[24px] rounded-full text-sm shadow-glow hover:shadow-glow-lg hover:scale-[1.03] transition-all duration-200"
              >
                Subir mi primera carpeta — Gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Logo marquee ─── */}
        <div className="relative z-10 pb-10">
          <div className="max-w-5xl mx-auto px-8">
            <div className="flex items-center gap-12">
              {/* Left: static text */}
              <div className="hidden md:block shrink-0 text-zinc-100/50 text-sm leading-5 max-w-[140px]">
                Confiado por marcas<br />y agencias
              </div>

              {/* Right: scrolling marquee */}
              <div className="flex-1 overflow-hidden">
                <div className="animate-marquee flex gap-16 w-max">
                  {[...marqueeLogos, ...marqueeLogos].map((logo, i) => (
                    <div key={i} className="flex items-center gap-3 shrink-0">
                      <div className="liquid-glass flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-zinc-100">
                        {logo.letter}
                      </div>
                      <span className="text-base font-semibold text-zinc-100 whitespace-nowrap">
                        {logo.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <StatsStrip />

      {/* ─── How it works ─── */}
      <section id="como-funciona" className="py-28 px-6 relative">
        <div className="aurora w-[500px] h-[300px] bg-accent-orange/[0.04] bottom-20 right-0" style={{ animationDelay: "6s" }} />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Cómo funciona
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Tres pasos. <span className="text-gradient">Cero complicaciones.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="01"
              icon={<Upload className="h-5 w-5" />}
              title="Arrastra tu carpeta (o ZIP)"
              description="Sube tu carpeta o ZIP con fotos, videos y textos. No importa cómo lo organices — AutoPost lo entiende."
              accent="brand"
            />
            <StepCard
              number="02"
              icon={<Layers className="h-5 w-5" />}
              title="Revisión automática"
              description="AutoPost detecta carruseles, empareja fotos con textos y te muestra todo para que lo revises."
              accent="blue"
            />
            <StepCard
              number="03"
              icon={<Calendar className="h-5 w-5" />}
              title="Programa y olvida"
              description="Elige horario y frecuencia. AutoPost publica automáticamente durante los próximos 30 días."
              accent="orange"
            />
          </div>
        </div>
      </section>

      {/* ─── Differentiation block ─── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-brand-500/15 bg-surface-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.05]">
              {/* Before */}
              <div className="p-8 space-y-4">
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-[0.15em]">Con herramientas tradicionales</p>
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
                    <p className="text-sm text-zinc-500 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              {/* After */}
              <div className="p-8 space-y-4 bg-brand-500/[0.03]">
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.15em]">Con AutoPost</p>
                {[
                  "Subir una carpeta o ZIP con todo",
                  "Copy extraído automáticamente del .txt",
                  "Carruseles detectados sin numerar fotos",
                  "30 días de programación en una sola configuración",
                  "2 minutos por cliente",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-brand-400 shrink-0" />
                    <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-28 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Características
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Todo lo que necesitas. <span className="text-gradient">Nada que no.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Layers className="h-5 w-5 text-brand-400" />}
              title="Detección de carruseles"
              description="Detecta automáticamente cuando varias fotos forman un carrusel. Sin numerarlas manualmente."
              glow="brand"
            />
            <FeatureCard
              icon={<CheckCircle className="h-5 w-5 text-accent-orange" />}
              title="Extracción de copy"
              description="Lee archivos de texto y los asocia a cada post automáticamente. Cero copia y pega."
              glow="orange"
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-brand-300" />}
              title="Programación inteligente"
              description="Configura frecuencia, días y horario. El calendario se ajusta solo a 30 días vista."
              glow="brand"
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-accent-orange" />}
              title="Conexión segura Meta API"
              description="OAuth oficial de Meta. Tu contraseña nunca se comparte ni se almacena jamás."
              glow="orange"
            />
            <FeatureCard
              icon={<Instagram className="h-5 w-5 text-brand-400" />}
              title="Fotos, videos y reels"
              description="Soporta JPG, PNG, WEBP, MP4 y MOV. Hasta 100 MB por archivo."
              glow="brand"
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5 text-accent-orange" />}
              title="Vista previa completa"
              description="Ve exactamente qué se publicará y cuándo antes de confirmar. Sin sorpresas."
              glow="orange"
            />
            <FeatureCard
              icon={<Users className="h-5 w-5 text-brand-300" />}
              title="Posts colaborativos"
              description="Aparece en dos feeds a la vez. Sin coordinación manual — doble audiencia, un solo post."
              glow="brand"
              highlight
            />
          </div>
        </div>
      </section>

      {/* ─── ROI Calculator ─── */}
      <ROICalculator />

      {/* ─── Testimonials ─── */}
      <TestimonialsSection />

      {/* ─── Pricing ─── */}
      <PricingSection />

      {/* ─── FAQ ─── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Preguntas frecuentes
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
              Todo claro antes de <span className="text-gradient">empezar</span>
            </h2>
          </div>
          <FAQAccordion />
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="py-28 px-6 relative">
        <div className="aurora w-[600px] h-[350px] bg-brand-500/[0.07] top-0 left-1/2 -translate-x-1/2" style={{ animationDelay: "2s" }} />
        <div className="aurora w-[400px] h-[250px] bg-accent-orange/[0.04] top-10 right-1/4" style={{ animationDelay: "5s" }} />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="rounded-3xl border border-brand-500/20 bg-surface-card p-12 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-accent-orange/[0.04] pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
                Deja de publicar <span className="text-gradient">a mano</span>
              </h2>
              <p className="text-lg text-zinc-400 mb-10 max-w-md mx-auto">
                Programa todo el mes de una vez y dedica tu tiempo a lo que importa.
              </p>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-base shadow-glow hover:shadow-glow-lg hover:scale-[1.03] transition-all duration-200"
              >
                Empezar gratis
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-sm text-zinc-600 mt-4">
                Sube tu primera carpeta gratis. Sin tarjeta.
              </p>

              <div className="mt-8 pt-6 border-t border-white/[0.04]">
                <p className="text-xs text-zinc-600 italic">
                  "Lo que Later tarda 2 horas, AutoPost lo hace en{" "}
                  <span className="text-zinc-400 not-italic font-semibold">2 minutos</span>"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/15">
              <Zap className="h-3 w-3 text-brand-400" />
            </div>
            <span className="font-display font-bold text-sm">AutoPost</span>
          </div>
          <p className="text-xs text-zinc-600">
            Hecho para agencias e influencers hispanohablantes
          </p>
          <div className="flex items-center gap-5 text-xs text-zinc-600">
            <a href="/privacidad" className="hover:text-zinc-400 transition-colors">
              Política de privacidad
            </a>
            <a href="/terminos" className="hover:text-zinc-400 transition-colors">
              Términos de uso
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
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", glow: "group-hover:shadow-glow-amber" },
    orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", glow: "group-hover:shadow-glow-orange" },
    cyan:   { bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   text: "text-cyan-400",   glow: "group-hover:shadow-glow-blue" },
  };
  const a = accents[accent] ?? accents.brand;

  return (
    <div className={`group relative rounded-2xl border border-white/[0.06] bg-surface-card p-7 card-interactive ${a.glow}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-5">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} border ${a.border} ${a.text}`}>
            {icon}
          </div>
          <span className="text-xs font-mono text-zinc-600 tracking-wider">{number}</span>
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
        "group flex gap-4 rounded-xl border p-5 card-interactive",
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
              Único
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Testimonials ─── */

const testimonials = [
  {
    quote: "Antes tardábamos 3 horas cada lunes preparando el contenido de los clientes. Ahora subimos el ZIP y listo en 5 minutos. AutoPost lo organiza todo.",
    name: "Marina López",
    role: "Directora de Social Media, Agencia Pulso",
    initials: "ML",
  },
  {
    quote: "La detección de carruseles es increíble. Ya no tengo que numerar las fotos ni preocuparme por el orden. Subo la carpeta y AutoPost lo hace perfecto.",
    name: "Diego Sánchez",
    role: "Content Creator, @diegoviaja",
    initials: "DS",
  },
  {
    quote: "Gestionamos 12 cuentas para clientes. Sin AutoPost no podríamos. El plan Agencia se pagó solo el primer mes con el tiempo que nos ahorró.",
    name: "Carla Fuentes",
    role: "CEO, SocialCraft Agency",
    initials: "CF",
  },
];

function TestimonialsSection() {
  return (
    <section className="py-28 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
            Testimonios
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
            Lo que dicen <span className="text-gradient">quienes ya lo usan</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
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
    <div className="relative rounded-2xl border border-white/[0.06] bg-surface-elevated p-7 flex flex-col gap-5">
      <span className="absolute top-4 right-5 text-6xl font-display text-brand-500/10 leading-none select-none" aria-hidden="true">
        "
      </span>
      <p className="text-sm text-zinc-300 leading-relaxed relative z-10">"{quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-orange/15 border border-brand-500/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand-300">{initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Logo marquee data ─── */

const marqueeLogos = [
  { letter: "P", name: "Pulso" },
  { letter: "S", name: "SocialCraft" },
  { letter: "N", name: "Nómada" },
  { letter: "C", name: "Creativa" },
  { letter: "A", name: "Astral" },
  { letter: "V", name: "Viraly" },
];

/* ─── Pricing ─── */

const pricingTiers = [
  {
    name: "Free",
    priceLabel: "Gratis",
    description: "Para empezar sin compromiso",
    features: [
      "1 cuenta de Instagram",
      "30 posts por mes",
      "Detección automática de carruseles",
      "Extracción de copy desde .txt",
      "Publicación automática via API oficial",
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
      "Flujo de aprobación de contenido",
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
      "Logs de auditoría completos",
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
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
            Precios
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
            Simple y <span className="text-gradient">sin sorpresas</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Shield className="h-3.5 w-3.5 text-brand-400" />
            Conexión oficial Meta API
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Lock className="h-3.5 w-3.5 text-brand-400" />
            Cifrado AES-256
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CheckCircle className="h-3.5 w-3.5 text-brand-400" />
            Cancela cuando quieras
          </div>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-4">
          Sin tarjeta de crédito en el plan Free
        </p>
      </div>
    </section>
  );
}

function PricingCard({ tier }: { tier: typeof pricingTiers[0] }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-7 flex flex-col gap-6",
        tier.popular
          ? "border-brand-500/30 bg-brand-500/[0.05] shadow-glow-sm"
          : "border-white/[0.06] bg-surface-card"
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-gradient-brand-vivid text-white shadow-glow-sm whitespace-nowrap">
            Más popular
          </span>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{tier.name}</p>
        <p className="font-display font-extrabold text-3xl text-white">{tier.priceLabel}</p>
        <p className="text-sm text-zinc-500 mt-1">{tier.description}</p>
      </div>

      <ul className="space-y-2.5 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <CheckCircle className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href="/signup"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200",
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
