"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink, CheckCircle, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
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
        setError(data.error ?? "No se pudo iniciar la conexión. Inténtalo de nuevo.");
        setLoading(false);
        return;
      }
      window.location.href = data.data.oauthUrl;
    } catch {
      setError("Error de red. Comprueba tu conexión e inténtalo de nuevo.");
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
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Conecta tu Instagram</h1>
          <p className="text-slate-500 text-sm mt-0.5">Paso {step} de {TOTAL}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500"
          style={{ width: `${Math.round((step / TOTAL) * 100)}%` }}
        />
      </div>

      {/* ── Step 1: Tipo de cuenta ───────────────────────── */}
      {step === 1 && (
        <StepCard
          icon="👤"
          title="¿Tienes cuenta profesional en Instagram?"
          subtitle="Instagram tiene dos tipos de cuenta. Para usar AutoPost necesitas una profesional (empresa o creador)."
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-slate-200 rounded-xl p-4 text-center space-y-1 opacity-50">
                <div className="text-2xl">👤</div>
                <p className="text-xs font-semibold text-slate-600">Personal</p>
                <p className="text-xs text-slate-400">No compatible</p>
              </div>
              <div className="border-2 border-pink-400 bg-pink-50 rounded-xl p-4 text-center space-y-1">
                <div className="text-2xl">🏢</div>
                <p className="text-xs font-semibold text-pink-700">Profesional</p>
                <p className="text-xs text-pink-500">Empresa o Creador</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              ¿No sabes si la tienes?{" "}
              <a
                href="https://help.instagram.com/502981923235522"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 underline inline-flex items-center gap-0.5"
              >
                Compruébalo aquí <ExternalLink className="h-3 w-3" />
              </a>
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">¿Tienes cuenta personal?</p>
              <p className="text-xs text-amber-600">
                Puedes cambiarla gratis en{" "}
                <a
                  href="https://help.instagram.com/502981923235522"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Instagram → Ajustes → Tipo de cuenta
                </a>. Tarda menos de 1 minuto.
              </p>
            </div>
          </div>
          <NavRow onNext={() => setStep(2)} nextLabel="Sí, tengo cuenta profesional →" />
        </StepCard>
      )}

      {/* ── Step 2: Vincular Facebook ────────────────────── */}
      {step === 2 && (
        <StepCard
          icon="📘"
          title="¿Tienes página de Facebook vinculada?"
          subtitle="Instagram profesional necesita estar conectado a una página de Facebook para publicar automáticamente."
        >
          <div className="space-y-3">
            <div className="space-y-2.5">
              <CheckItem text="Tu cuenta de Instagram es empresa o creador" />
              <CheckItem text="Tienes una página de Facebook (no perfil personal)" />
              <CheckItem text="Eres administrador de esa página de Facebook" />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-blue-700">¿Cómo vinculo Instagram con Facebook?</p>
              <ol className="text-xs text-blue-600 space-y-1 list-decimal ml-4">
                <li>Abre Instagram en tu móvil</li>
                <li>Ve a tu perfil → <strong>Editar perfil</strong></li>
                <li>Toca <strong>"Conectar o crear página de Facebook"</strong></li>
                <li>Sigue los pasos para vincular</li>
              </ol>
            </div>
          </div>
          <NavRow
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Todo listo, conectar →"
          />
        </StepCard>
      )}

      {/* ── Step 3: Conectar ─────────────────────────────── */}
      {step === 3 && (
        <StepCard
          icon={<Instagram className="h-6 w-6 text-pink-500" />}
          title="Autoriza a AutoPost"
          subtitle="Haz clic en el botón de abajo. Se abrirá una ventana de Facebook/Instagram donde debes aceptar los permisos."
        >
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600">AutoPost solicitará permiso para:</p>
              <PermissionItem text="Ver tu cuenta de Instagram" />
              <PermissionItem text="Publicar fotos y vídeos en tu nombre" />
              <PermissionItem text="Ver tus páginas de Facebook" />
            </div>

            <p className="text-xs text-slate-400 text-center">
              Nunca compartimos tu contraseña. Puedes revocar el acceso en cualquier momento.
            </p>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
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
              className="w-full text-sm text-slate-400 hover:text-slate-600 py-1"
            >
              ← Volver
            </button>
          </div>
        </StepCard>
      )}
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────

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
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-br from-pink-50 to-white border-b border-slate-100 px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-pink-100 flex items-center justify-center shrink-0 text-xl">
            {icon}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg leading-tight">{title}</h2>
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
  nextLabel = "Siguiente →",
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
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
      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function PermissionItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
      <p className="text-xs text-slate-600">{text}</p>
    </div>
  );
}
