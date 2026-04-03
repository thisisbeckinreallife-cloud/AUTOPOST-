"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink, CheckCircle, ArrowLeft, ArrowRight, AlertCircle, User, Building2, Facebook } from "lucide-react";
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
        setError(data.error ?? "No se pudo iniciar la conexion. Intentalo de nuevo.");
        setLoading(false);
        return;
      }
      window.location.href = data.data.oauthUrl;
    } catch {
      setError("Error de red. Comprueba tu conexion e intentalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => step > 1 ? setStep(step - 1) : router.back()}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Conecta tu Instagram</h1>
          <p className="text-slate-500 text-sm mt-0.5">Paso {step} de {TOTAL}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
          style={{ width: `${Math.round((step / TOTAL) * 100)}%` }}
        />
      </div>

      {/* Step 1: Account type */}
      {step === 1 && (
        <StepCard
          icon={<User className="h-5 w-5 text-brand-400" />}
          title="Tienes cuenta profesional en Instagram?"
          subtitle="Instagram tiene dos tipos de cuenta. Para usar AutoPost necesitas una profesional (empresa o creador)."
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-700 rounded-xl p-4 text-center space-y-1 opacity-40">
                <User className="h-6 w-6 mx-auto text-slate-500" />
                <p className="text-xs font-semibold text-slate-400">Personal</p>
                <p className="text-xs text-slate-600">No compatible</p>
              </div>
              <div className="border-2 border-brand-500/50 bg-brand-500/5 rounded-xl p-4 text-center space-y-1">
                <Building2 className="h-6 w-6 mx-auto text-brand-400" />
                <p className="text-xs font-semibold text-brand-300">Profesional</p>
                <p className="text-xs text-brand-400/70">Empresa o Creador</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              No sabes si la tienes?{" "}
              <a
                href="https://help.instagram.com/502981923235522"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 underline inline-flex items-center gap-0.5"
              >
                Compruebalo aqui <ExternalLink className="h-3 w-3" />
              </a>
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-400 mb-1">Tienes cuenta personal?</p>
              <p className="text-xs text-amber-400/70">
                Puedes cambiarla gratis en{" "}
                <a
                  href="https://help.instagram.com/502981923235522"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Instagram - Ajustes - Tipo de cuenta
                </a>. Tarda menos de 1 minuto.
              </p>
            </div>
          </div>
          <NavRow onNext={() => setStep(2)} nextLabel="Si, tengo cuenta profesional" />
        </StepCard>
      )}

      {/* Step 2: Link Facebook */}
      {step === 2 && (
        <StepCard
          icon={<Facebook className="h-5 w-5 text-brand-400" />}
          title="Tienes pagina de Facebook vinculada?"
          subtitle="Instagram profesional necesita estar conectado a una pagina de Facebook para publicar automaticamente."
        >
          <div className="space-y-3">
            <div className="space-y-2.5">
              <CheckItem text="Tu cuenta de Instagram es empresa o creador" />
              <CheckItem text="Tienes una pagina de Facebook (no perfil personal)" />
              <CheckItem text="Eres administrador de esa pagina de Facebook" />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-blue-400">Como vinculo Instagram con Facebook?</p>
              <ol className="text-xs text-blue-400/70 space-y-1 list-decimal ml-4">
                <li>Abre Instagram en tu movil</li>
                <li>Ve a tu perfil - <strong>Editar perfil</strong></li>
                <li>Toca <strong>&quot;Conectar o crear pagina de Facebook&quot;</strong></li>
                <li>Sigue los pasos para vincular</li>
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
          icon={<Instagram className="h-5 w-5 text-brand-400" />}
          title="Autoriza a AutoPost"
          subtitle="Haz clic en el boton de abajo. Se abrira una ventana de Facebook/Instagram donde debes aceptar los permisos."
        >
          <div className="space-y-3">
            <div className="bg-surface-primary rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400">AutoPost solicitara permiso para:</p>
              <PermissionItem text="Ver tu cuenta de Instagram" />
              <PermissionItem text="Publicar fotos y videos en tu nombre" />
              <PermissionItem text="Ver tus paginas de Facebook" />
            </div>

            <p className="text-xs text-slate-600 text-center">
              Nunca compartimos tu contrasena. Puedes revocar el acceso en cualquier momento.
            </p>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <Button
              onClick={handleConnect}
              loading={loading}
              className="w-full h-12 text-base gap-2"
            >
              <Instagram className="h-5 w-5" />
              Conectar mi Instagram
            </Button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-sm text-slate-500 hover:text-slate-300 py-1 transition-colors"
            >
              Volver
            </button>
          </div>
        </StepCard>
      )}
    </div>
  );
}

// Subcomponents

function StepCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-card border border-slate-800 rounded-2xl overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-br from-brand-500/5 to-transparent border-b border-slate-800 px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-lg leading-tight">{title}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
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
    <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
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

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}

function PermissionItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
      <p className="text-xs text-slate-400">{text}</p>
    </div>
  );
}
