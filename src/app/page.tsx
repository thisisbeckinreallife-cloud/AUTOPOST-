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
} from "lucide-react";

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
            <Link
              href="/login"
              className="text-sm font-semibold px-4 py-2 rounded-lg border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
            >
              Iniciar sesion
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
        <div className="aurora w-[400px] h-[250px] bg-accent-cyan/[0.04] top-20 right-1/4 translate-x-1/2" style={{ animationDelay: "8s" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/[0.06] text-xs font-medium text-brand-300 mb-8 animate-fade-up backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Automatizacion inteligente para Instagram
          </div>

          <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight leading-[1.05] mb-7 animate-fade-up stagger-1">
            Programa un mes de{" "}
            <span className="text-gradient-hero">Instagram</span>{" "}
            en 2 minutos
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed animate-fade-up stagger-2">
            Sube una carpeta con tus posts. AutoPost detecta carruseles, extrae
            el copy y programa todo a 30 dias vista.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-gradient-brand-vivid text-white font-semibold px-8 py-4 rounded-xl text-sm shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              Empezar ahora
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium px-6 py-4 text-sm transition-colors"
            >
              Ver como funciona
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Floating orbs */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
      </section>

      {/* ─── Social proof strip ─── */}
      <section className="relative border-y border-white/[0.04] py-10 px-6 bg-gradient-cta">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-20 text-center">
          <Stat value="2 min" label="para programar un mes" accent="brand" />
          <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
          <Stat value="30 dias" label="de contenido automatizado" accent="violet" />
          <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
          <Stat value="0" label="publicacion manual" accent="cyan" />
        </div>
      </section>

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
              description="Arrastra una carpeta o ZIP con tus fotos, videos y textos. No importa como lo organices."
              accent="brand"
            />
            <StepCard
              number="02"
              icon={<Layers className="h-5 w-5" />}
              title="Revision automatica"
              description="AutoPost detecta carruseles, empareja fotos con textos y te muestra todo para que lo revises."
              accent="violet"
            />
            <StepCard
              number="03"
              icon={<Calendar className="h-5 w-5" />}
              title="Programa y olvida"
              description="Elige horario y frecuencia. AutoPost publica automaticamente durante los proximos 30 dias."
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
              Caracteristicas
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Todo lo que necesitas. <span className="text-gradient">Nada que no.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Layers className="h-5 w-5 text-blue-400" />}
              title="Deteccion de carruseles"
              description="Detecta automaticamente cuando varias fotos forman un carrusel."
              glow="blue"
            />
            <FeatureCard
              icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
              title="Extraccion de copy"
              description="Lee archivos de texto y los asocia a cada post automaticamente."
              glow="emerald"
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              title="Programacion inteligente"
              description="Configura frecuencia, dias y horario. El calendario se ajusta solo."
              glow="amber"
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-violet-400" />}
              title="Conexion segura"
              description="OAuth oficial de Meta. Tu contrasena nunca se comparte."
              glow="violet"
            />
            <FeatureCard
              icon={<Instagram className="h-5 w-5 text-pink-400" />}
              title="Fotos, videos y reels"
              description="Soporta JPG, PNG, WEBP, MP4 y MOV. Hasta 100MB por subida."
              glow="pink"
            />
            <FeatureCard
              icon={<Calendar className="h-5 w-5 text-cyan-400" />}
              title="Vista previa"
              description="Ve exactamente que se publicara y cuando antes de confirmar."
              glow="cyan"
            />
          </div>
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
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-500/15">
              <Zap className="h-3 w-3 text-brand-400" />
            </div>
            <span className="font-display font-bold text-sm">AutoPost</span>
          </div>
          <p className="text-xs text-zinc-600">
            Automatiza tu Instagram. Sin esfuerzo.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Subcomponents ─── */

function Stat({ value, label, accent }: { value: string; label: string; accent: string }) {
  const colors: Record<string, string> = {
    brand: "from-brand-400 to-brand-500",
    violet: "from-violet-400 to-purple-500",
    cyan: "from-cyan-400 to-blue-500",
  };
  return (
    <div>
      <p className={`font-display font-extrabold text-3xl bg-gradient-to-r ${colors[accent] ?? colors.brand} bg-clip-text text-transparent`}>
        {value}
      </p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

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
    brand: { bg: "bg-brand-500/10", border: "border-brand-500/20", text: "text-brand-400", glow: "group-hover:shadow-glow-sm" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", glow: "group-hover:shadow-glow-violet" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", glow: "group-hover:shadow-glow-cyan" },
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  glow: string;
}) {
  const glowColors: Record<string, string> = {
    blue: "group-hover:border-blue-500/15",
    emerald: "group-hover:border-emerald-500/15",
    amber: "group-hover:border-amber-500/15",
    violet: "group-hover:border-violet-500/15",
    pink: "group-hover:border-pink-500/15",
    cyan: "group-hover:border-cyan-500/15",
  };

  return (
    <div className={`group flex gap-4 rounded-xl border border-white/[0.05] bg-surface-card/60 p-5 card-interactive ${glowColors[glow] ?? ""}`}>
      <div className="mt-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">{icon}</div>
      <div>
        <h3 className="font-semibold text-sm text-white mb-1.5">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
