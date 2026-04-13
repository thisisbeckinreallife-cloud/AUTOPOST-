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
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-primary text-zinc-100">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 border border-brand-500/20">
              <Zap className="h-4 w-4 text-brand-400" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Auto<span className="text-gradient">Post</span>
            </span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Iniciar sesion
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-brand-500/[0.07] to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/[0.06] text-xs font-medium text-brand-300 mb-8">
            <Zap className="h-3 w-3" />
            Automatizacion inteligente para Instagram
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1] mb-6">
            Programa un mes de{" "}
            <span className="text-gradient">Instagram</span>{" "}
            en 2 minutos
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Sube una carpeta con tus posts. AutoPost detecta carruseles, extrae
            el copy y programa todo a 30 dias vista. Sin complicaciones.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-7 py-3.5 rounded-xl text-sm shadow-glow hover:shadow-glow-md transition-all"
            >
              Empezar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium px-5 py-3.5 text-sm transition-colors"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </section>

      {/* ─── Social proof strip ─── */}
      <section className="border-y border-white/[0.04] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
          <Stat value="2 min" label="para programar un mes" />
          <div className="hidden sm:block w-px h-8 bg-white/[0.06]" />
          <Stat value="30 dias" label="de contenido automatizado" />
          <div className="hidden sm:block w-px h-8 bg-white/[0.06]" />
          <Stat value="0" label="publicacion manual" />
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="como-funciona" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">
              Como funciona
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
              Tres pasos. Cero complicaciones.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number="01"
              icon={<Upload className="h-5 w-5" />}
              title="Sube tu contenido"
              description="Arrastra una carpeta o ZIP con tus fotos, videos y textos. No importa como lo organices."
            />
            <StepCard
              number="02"
              icon={<Layers className="h-5 w-5" />}
              title="Revision automatica"
              description="AutoPost detecta carruseles, empareja fotos con textos y te muestra todo para que lo revises."
            />
            <StepCard
              number="03"
              icon={<Calendar className="h-5 w-5" />}
              title="Programa y olvida"
              description="Elige horario y frecuencia. AutoPost publica automaticamente durante los proximos 30 dias."
            />
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">
              Caracteristicas
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
              Todo lo que necesitas. Nada que no.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Layers className="h-4.5 w-4.5 text-blue-400" />}
              title="Deteccion de carruseles"
              description="Detecta automaticamente cuando varias fotos en una carpeta forman un carrusel."
            />
            <FeatureCard
              icon={<CheckCircle className="h-4.5 w-4.5 text-green-400" />}
              title="Extraccion de copy"
              description="Lee archivos de texto y los asocia a cada post. Sin copiar y pegar manual."
            />
            <FeatureCard
              icon={<Clock className="h-4.5 w-4.5 text-amber-400" />}
              title="Programacion inteligente"
              description="Configura frecuencia, dias y horario. El calendario se ajusta solo."
            />
            <FeatureCard
              icon={<Shield className="h-4.5 w-4.5 text-purple-400" />}
              title="Conexion segura"
              description="OAuth oficial de Meta. Tu contrasena nunca se comparte. Revocable en cualquier momento."
            />
            <FeatureCard
              icon={<Instagram className="h-4.5 w-4.5 text-pink-400" />}
              title="Fotos, videos y reels"
              description="Soporta JPG, PNG, WEBP, MP4 y MOV. Hasta 100MB por subida."
            />
            <FeatureCard
              icon={<Calendar className="h-4.5 w-4.5 text-brand-400" />}
              title="Vista previa del calendario"
              description="Ve exactamente que se publicara y cuando antes de confirmar."
            />
          </div>
        </div>
      </section>

      {/* ─── CTA final ─── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4">
            Deja de publicar a mano
          </h2>
          <p className="text-lg text-zinc-400 mb-10 max-w-md mx-auto">
            Programa todo el mes de una vez y dedica tu tiempo a lo que importa.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-8 py-4 rounded-xl text-base shadow-glow hover:shadow-glow-md transition-all"
          >
            Empezar gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/[0.04] py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-400" />
            <span className="font-display font-bold text-sm">AutoPost</span>
          </div>
          <p className="text-xs text-zinc-500">
            Automatiza tu Instagram. Sin esfuerzo.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Subcomponents ─── */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display font-bold text-2xl text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-surface-card p-6 group hover:border-white/[0.1] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 border border-brand-500/15 text-brand-400">
          {icon}
        </div>
        <span className="text-xs font-mono text-zinc-600">{number}</span>
      </div>
      <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-white/[0.04] bg-surface-card/50 p-5 hover:border-white/[0.08] transition-all">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <h3 className="font-semibold text-sm text-white mb-1">{title}</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
