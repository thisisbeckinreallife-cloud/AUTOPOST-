"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink, CheckCircle, ArrowLeft, ArrowRight, AlertCircle, User, Building2, Facebook, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function ConnectPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const TOTAL = 3;

  async function handleConnect() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${slug}/connect`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos conectar con Instagram. Inténtalo de nuevo o escríbenos si el error persiste.");
        setLoading(false);
        return;
      }
      window.location.href = data.data.oauthUrl;
    } catch {
      setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
      setLoading(false);
    }
  }

  const completedSteps = step - 1;
  const progress = Math.round((completedSteps / TOTAL) * 100);

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="p-2 rounded-lg hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-white">Conecta tu Instagram</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Paso {step} de {TOTAL}</p>
        </div>
      </div>

      {/* Meta API trust badge */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-green-500/15 bg-green-500/[0.04]">
        <Shield className="h-4 w-4 text-green-400 shrink-0" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          <span className="text-green-400 font-semibold">Conexión oficial via Instagram API de Meta</span>
          {" "}— AutoPost nunca accede a tu contraseña. Puedes revocar el acceso en cualquier momento desde Instagram.
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 animate-fade-up stagger-1">
        <div className="flex-1 h-1.5 bg-zinc-800/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-orange rounded-full transition-all duration-500 progress-glow"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-zinc-600 tabular-nums font-medium">{step}/{TOTAL}</span>
      </div>

      {/* Step 1: Account type */}
      {step === 1 && (
        <StepCard
          step={1}
          icon={<User className="h-5 w-5 text-brand-400" />}
          title="Tienes cuenta profesional?"
          subtitle="Para publicar automaticamente, Instagram requiere una cuenta de empresa o creador."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-white/[0.06] rounded-xl p-4 text-center space-y-2 opacity-40">
                <User className="h-6 w-6 mx-auto text-zinc-600" />
                <div>
                  <p className="text-xs font-semibold text-zinc-500">Personal</p>
                  <p className="text-[11px] text-zinc-700">No compatible</p>
                </div>
              </div>
              <div className="border border-brand-500/30 bg-brand-500/[0.04] rounded-xl p-4 text-center space-y-2">
                <Building2 className="h-6 w-6 mx-auto text-brand-400" />
                <div>
                  <p className="text-xs font-semibold text-brand-300">Profesional</p>
                  <p className="text-[11px] text-brand-400/60">Empresa o Creador</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-300">No tienes cuenta profesional?</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Cambiala gratis en Instagram → Ajustes → Tipo de cuenta. Tarda menos de 1 minuto.
              </p>
              <a
                href="https://help.instagram.com/502981923235522"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                Ver como cambiarla <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <NavRow onNext={() => setStep(2)} nextLabel="Tengo cuenta profesional" />
        </StepCard>
      )}

      {/* Step 2: Facebook link */}
      {step === 2 && (
        <StepCard
          step={2}
          icon={<Facebook className="h-5 w-5 text-brand-400" />}
          title="Pagina de Facebook vinculada?"
          subtitle="Instagram profesional necesita estar conectado a una pagina de Facebook."
        >
          <div className="space-y-4">
            {/* Checklist */}
            <div className="rounded-xl border border-white/[0.06] bg-surface-card divide-y divide-white/[0.04]">
              <CheckItem text="Tu cuenta de Instagram es profesional" checked />
              <CheckItem text="Tienes una pagina de Facebook (no perfil)" />
              <CheckItem text="Eres administrador de esa pagina" />
            </div>

            {/* How-to */}
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-300">Como vinculo Instagram con Facebook?</p>
              <ol className="space-y-2">
                <HowToStep n={1} text="Abre Instagram en tu movil" />
                <HowToStep n={2} text='Ve a tu perfil → "Editar perfil"' />
                <HowToStep n={3} text='"Conectar o crear pagina de Facebook"' />
                <HowToStep n={4} text="Sigue los pasos para vincular" />
              </ol>
            </div>
          </div>
          <NavRow
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Todo listo, conectar"
          />
        </StepCard>
      )}

      {/* Step 3: Authorize */}
      {step === 3 && (
        <StepCard
          step={3}
          icon={<Instagram className="h-5 w-5 text-brand-400" />}
          title="Autoriza a AutoPost"
          subtitle="Se abrira una ventana de Facebook/Instagram donde debes aceptar los permisos."
        >
          <div className="space-y-4">
            {/* Permissions */}
            <div className="rounded-xl border border-white/[0.06] bg-surface-card p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-400">Permisos solicitados:</p>
              <PermissionItem text="Ver tu cuenta de Instagram" />
              <PermissionItem text="Publicar fotos y videos en tu nombre" />
              <PermissionItem text="Ver tus paginas de Facebook" />
            </div>

            {/* Trust signal */}
            <div className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <Shield className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-zinc-300">Conexion segura</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Usamos OAuth oficial de Meta. Tu contrasena nunca se comparte. Puedes revocar el acceso en cualquier momento.
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.04] space-y-2">
            <Button
              onClick={handleConnect}
              loading={loading}
              variant="gradient"
              className="w-full h-12 text-sm font-semibold gap-2"
            >
              <Instagram className="h-4 w-4" />
              Conectar mi Instagram
            </Button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-sm text-zinc-600 hover:text-zinc-400 py-1 transition-colors"
            >
              Volver
            </button>
          </div>
        </StepCard>
      )}
    </div>
  );
}

/* ─── Subcomponents ─── */

function StepCard({
  step,
  icon,
  title,
  subtitle,
  children,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-card overflow-hidden animate-fade-up">
      <div className="bg-gradient-subtle border-b border-white/[0.04] px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-orange/10 border border-brand-500/15 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="font-display font-bold text-white text-lg leading-tight">{title}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextLabel = "Siguiente",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-3 border-t border-white/[0.04]">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/[0.08] text-sm font-medium text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Atras
        </button>
      )}
      <Button onClick={onNext} className="flex-1 h-11 gap-1.5 text-sm">
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CheckItem({ text, checked }: { text: string; checked?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <CheckCircle className={`h-4 w-4 shrink-0 ${checked ? "text-green-400" : "text-zinc-700"}`} />
      <p className="text-sm text-zinc-300">{text}</p>
    </div>
  );
}

function HowToStep({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/10 text-[10px] font-bold text-brand-400 shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-xs text-zinc-400 leading-relaxed">{text}</p>
    </li>
  );
}

function PermissionItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
      <p className="text-xs text-zinc-400">{text}</p>
    </div>
  );
}
