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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQAccordion } from "@/components/landing/faq-accordion";
import { StatsStrip } from "@/components/landing/stats-strip";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-primary text-zinc-100 overflow-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/20 to-accent-violet/10 border border-brand-500/25">
              <Zap className="h-4 w-4 text-brand-400" />
              <div className="absolute inset-0 rounded-lg bg-brand-500/10 animate-glow-pulse" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Auto<span className="text-gradient">Post</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#como-funciona"
              className="hidden sm:inline text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Como funciona
            </a>
            <a
              href="#precios"
              className="hidden sm:inline text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              Precios
            </a>
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-36 pb-28 px-6">
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="aurora w-[700px] h-[400px] bg-brand-500/[0.08] top-10 left-1/2 -translate-x-1/2" />
        <div className="aurora w-[500px] h-[300px] bg-accent-violet/[0.06] top-40 left-1/4 -translate-x-1/2" style={{ animationDelay: "4s" }} />
        <div className="aurora w-[400px] h-[250px] bg-accent-rose/[0.04] top-20 right-1/4 translate-x-1/2" style={{ animationDelay: "8s" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/[0.06] text-xs font-medium text-brand-300 mb-8 animate-fade-up backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Automatización inteligente para Instagram
          </div>

          <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[1.05] mb-5 animate-fade-up stagger-1">
            Programa un mes de{" "}
            <span className="text-gradient-hero">Instagram</span>{" "}
            en 2 minutos
          </h1>

          {/* Social proof counter */}
          <p className="text-sm text-zinc-500 mb-4 animate-fade-up stagger-2">
            Más de{" "}
            <span className="text-zinc-300 font-semibold">500 agencias y creadores</span>{" "}
            ya programan con AutoPost
          </p>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed animate-fade-up stagger-2">
            Sube la carpeta. AutoPost detecta carruseles, pone el copy solo y programa
            30 días de una vez.{" "}
            <span className="text-zinc-300">Tú a otra cosa.</span>
          </p>

          {/* Dashboard mockup */}
          <div className="relative mx-auto mt-8 mb-10 max-w-lg rounded-2xl border border-white/[0.08] bg-surface-card/80 backdrop-blur-sm overflow-hidden shadow-elevated animate-fade-up stagger-2">
            {/* Fake toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-surface-secondary/60">
              <div className="h-2 w-2 rounded-full bg-red-500/50" />
              <div className="h-2 w-2 rounded-full bg-amber-500/50" />
              <div className="h-2 w-2 rounded-full bg-green-500/50" />
              <span className="ml-2 text-[10px] text-zinc-600 font-mono">autopost — cola de publicaciones</span>
            </div>
            {/* Fake post rows */}
            {[
              { day: "Lun 14:00", type: "Carrusel", dots: 5, color: "bg-brand-500/10 text-brand-400" },
              { day: "Mié 10:00", type: "Foto",     dots: 1, color: "bg-green-500/10 text-green-400" },
              { day: "Vie 18:00", type: "Reel",     dots: 1, color: "bg-violet-500/10 text-violet-400" },
              { day: "Dom 09:00", type: "Carrusel", dots: 3, color: "bg-brand-500/10 text-brand-400" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0">
                <div className="flex gap-1 shrink-0">
                  {Array.from({ length: Math.min(row.dots, 3) }).map((_, j) => (
                    <div key={j} className="h-7 w-7 rounded-md bg-zinc-800 border border-white/[0.06]" />
                  ))}
                  {row.dots > 3 && (
                    <div className="h-7 w-7 rounded-md bg-zinc-800 border border-white/[0.06] flex items-center justify-center">
                      <span className="text-[9px] text-zinc-500">+{row.dots - 3}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="h-1.5 w-28 rounded-full bg-zinc-700" />
                  <div className="h-1.5 w-16 rounded-full bg-zinc-800 mt-1.5" />
                </div>
                <span className="text-[10px] text-zinc-600 shrink-0 font-mono">{row.day}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${row.color}`}>
                  {row.type}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-sm shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Programa tu primer mes — Es gratis
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium px-6 py-4 text-sm transition-colors"
            >
              Ver demo de 60 segundos
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Risk reversal */}
          <p className="text-xs text-zinc-600 mt-5 animate-fade-up stagger-4">
            Sin tarjeta de crédito · Cancela cuando quieras
          </p>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
      </section>

      {/* ─── Stats strip (animated, client component) ─── */}
      <StatsStrip />

      {/* ─── How it works ─── */}
      <section id="como-funciona" className="py-28 px-6 relative">
        <div className="aurora w-[500px] h-[300px] bg-accent-violet/[0.04] bottom-20 right-0" style={{ animationDelay: "6s" }} />

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Como funciona
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Tres pasos. <span className="text-gradient">Cero complicaciones.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="01"
              icon={<Upload className="h-5 w-5" />}
              title="Sube tu contenido"
              description="Arrastra una carpeta o ZIP con tus fotos, videos y textos. No importa cómo lo organices."
              accent="brand"
            />
            <StepCard
              number="02"
              icon={<Layers className="h-5 w-5" />}
              title="Revisión automática"
              description="AutoPost detecta carruseles, empareja fotos con textos y te muestra todo para que lo revises."
              accent="violet"
            />
            <StepCard
              number="03"
              icon={<Calendar className="h-5 w-5" />}
              title="Programa y olvida"
              description="Elige horario y frecuencia. AutoPost publica automáticamente durante los próximos 30 días."
              accent="cyan"
            />
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
              icon={<CheckCircle className="h-5 w-5 text-accent-violet" />}
              title="Extracción de copy"
              description="Lee archivos de texto y los asocia a cada post automáticamente. Cero copia y pega."
              glow="violet"
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-brand-300" />}
              title="Programación inteligente"
              description="Configura frecuencia, días y horario. El calendario se ajusta solo a 30 días vista."
              glow="brand"
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-accent-violet" />}
              title="Conexión segura"
              description="OAuth oficial de Meta. Tu contraseña nunca se comparte ni se almacena."
              glow="violet"
            />
            <FeatureCard
              icon={<Instagram className="h-5 w-5 text-brand-400" />}
              title="Fotos, videos y reels"
              description="Soporta JPG, PNG, WEBP, MP4 y MOV. Hasta 100 MB por archivo."
              glow="brand"
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5 text-accent-violet" />}
              title="Vista previa completa"
              description="Ve exactamente qué se publicará y cuándo antes de confirmar. Sin sorpresas."
              glow="violet"
            />
            <FeatureCard
              icon={<Users className="h-5 w-5 text-brand-300" />}
              title="Posts colaborativos"
              description="Invita a otros creadores como colaboradores. Un post, dos feeds, el doble de audiencia."
              glow="brand"
              highlight
            />
          </div>
        </div>
      </section>

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
        <div className="aurora w-[600px] h-[350px] bg-brand-500/[0.06] top-0 left-1/2 -translate-x-1/2" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="rounded-3xl border border-white/[0.06] bg-surface-card p-12 sm:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.04] via-transparent to-accent-violet/[0.03] pointer-events-none" />
            <div className="relative">
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
                Deja de publicar <span className="text-gradient">a mano</span>
              </h2>
              <p className="text-lg text-zinc-400 mb-10 max-w-md mx-auto">
                Programa todo el mes de una vez y dedica tu tiempo a lo que importa.
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-base shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5"
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
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", glow: "group-hover:shadow-glow-violet" },
    cyan:   { bg: "bg-cyan-500/10",   border: "border-cyan-500/20",   text: "text-cyan-400",   glow: "group-hover:shadow-glow-cyan" },
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
    violet: "group-hover:border-accent-violet/20",
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
      <span
        className="absolute top-4 right-5 text-6xl font-display text-brand-500/10 leading-none select-none"
        aria-hidden="true"
      >
        "
      </span>
      <p className="text-sm text-zinc-300 leading-relaxed relative z-10">"{quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-violet/15 border border-brand-500/20 flex items-center justify-center shrink-0">
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

/* ─── Pricing ─── */

const pricingTiers = [
  {
    name: "Free",
    priceLabel: "Gratis",
    description: "Para empezar sin compromiso",
    features: [
      "1 cuenta de Instagram",
      "30 posts por mes",
      "Detección de carruseles",
      "Extracción de copy automática",
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
      "Todo lo del plan Free",
      "Posts colaborativos",
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
      "Multi-workspace",
      "Todo lo del plan Pro",
      "Panel multi-cliente",
      "Soporte directo prioritario",
    ],
    cta: "Hablar con ventas",
    popular: false,
  },
];

function PricingSection() {
  return (
    <section id="precios" className="py-28 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-violet/[0.02] to-transparent pointer-events-none" />
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

        <p className="text-center text-xs text-zinc-600 mt-8">
          Sin tarjeta de crédito en el plan Free · Cancela en cualquier momento
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
        href="/login"
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200",
          tier.popular
            ? "bg-gradient-brand-vivid text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5"
            : "border border-white/[0.1] text-zinc-300 hover:border-white/[0.18] hover:text-white hover:bg-white/[0.04]"
        )}
      >
        {tier.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
