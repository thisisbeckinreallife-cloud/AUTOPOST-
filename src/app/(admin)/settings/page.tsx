"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, XCircle, Eye, EyeOff, ExternalLink,
  Copy, Check, ArrowRight, ArrowLeft, Rocket, Settings,
} from "lucide-react";

interface ConfigStatus {
  META_APP_ID: boolean;
  META_APP_SECRET: boolean;
  META_REDIRECT_URI: boolean;
}

// ─── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-semibold transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Paso {step} de {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Instruction box ─────────────────────────────────────────────────────────
function Step({ n, text }: { n: number; text: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Mock UI screenshot ───────────────────────────────────────────────────────
function MockScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-100 px-3 py-2 flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 text-xs text-slate-400 font-mono">developers.facebook.com</span>
      </div>
      <div className="bg-white p-4">{children}</div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [editing, setEditing] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");

  const [form, setForm] = useState({
    META_APP_ID: "",
    META_APP_SECRET: "",
    META_REDIRECT_URI: "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const uri = `${window.location.origin}/api/meta/oauth/callback`;
    setRedirectUri(uri);
    setForm((f) => ({ ...f, META_REDIRECT_URI: uri }));
    loadStatus();
  }, []);

  async function loadStatus() {
    const res = await fetch("/api/settings/meta");
    if (res.ok) {
      const data = await res.json();
      setStatus(data.data);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const body: Record<string, string> = {
        META_APP_ID: form.META_APP_ID,
        META_REDIRECT_URI: redirectUri,
      };
      // Only send secret if user typed one
      if (form.META_APP_SECRET) body.META_APP_SECRET = form.META_APP_SECRET;

      const res = await fetch("/api/settings/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "No se pudo guardar. Inténtalo de nuevo.");
        return;
      }
      setSaveSuccess(true);
      setForm((f) => ({ ...f, META_APP_SECRET: "" }));
      await loadStatus();
      if (editing) setEditing(false);
    } catch {
      setSaveError("Error de red. Comprueba tu conexión.");
    } finally {
      setSaving(false);
    }
  }

  const allConfigured = status?.META_APP_ID && status?.META_APP_SECRET && status?.META_REDIRECT_URI;
  const TOTAL_STEPS = 5;

  // ── Already configured ───────────────────────────────────────────────────
  if (allConfigured && !editing) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-500 mt-1">Conexión con Meta</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Todo está configurado</p>
            <p className="text-sm text-green-700 mt-0.5">
              AutoPost está conectado con tu app de Meta y listo para publicar.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700">Credenciales guardadas</p>
          <Credential label="App ID" ok={status.META_APP_ID} />
          <Credential label="App Secret" ok={status.META_APP_SECRET} />
          <Credential label="URL de redirección" ok={status.META_REDIRECT_URI} />
        </div>

        <Button variant="outline" onClick={() => setEditing(true)} className="w-full h-11 gap-2">
          <Settings className="h-4 w-4" />
          Actualizar credenciales
        </Button>
      </div>
    );
  }

  // ── Edit mode (already configured, wants to update) ──────────────────────
  if (editing) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setEditing(false); setSaveError(""); setSaveSuccess(false); }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Actualizar credenciales</h1>
            <p className="text-slate-500 text-sm mt-0.5">Cambia los datos de tu app de Meta</p>
          </div>
        </div>

        <SimpleForm
          form={form}
          setForm={setForm}
          showSecret={showSecret}
          setShowSecret={setShowSecret}
          redirectUri={redirectUri}
          status={status}
          saving={saving}
          saveError={saveError}
          saveSuccess={saveSuccess}
          onSave={handleSave}
        />
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-1">Vamos a conectar AutoPost con Meta</p>
      </div>

      <ProgressBar step={wizardStep} total={TOTAL_STEPS} />

      {/* ── Step 1: Intro ─────────────────────────────────────────── */}
      {wizardStep === 1 && (
        <WizardCard
          icon={<Rocket className="h-6 w-6 text-pink-500" />}
          title="Conectemos AutoPost con Meta"
          subtitle="Necesitamos una app de Meta (gratis) para que AutoPost pueda publicar en Instagram. Te guiamos paso a paso."
        >
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
              <WizardCheckItem text="Solo tardarás unos 5 minutos" />
              <WizardCheckItem text="Es totalmente gratis" />
              <WizardCheckItem text="Solo necesitas una cuenta de Facebook" />
              <WizardCheckItem text="Lo harás una sola vez" />
            </div>
            <p className="text-xs text-slate-400 text-center">
              Si ya tienes una app de Meta, puedes saltar al paso 4.
            </p>
          </div>
          <WizardNav
            onNext={() => setWizardStep(2)}
            nextLabel="Empezar →"
            hideBack
          />
        </WizardCard>
      )}

      {/* ── Step 2: Crear app ──────────────────────────────────────── */}
      {wizardStep === 2 && (
        <WizardCard
          icon={<span className="text-2xl">🏗️</span>}
          title="Crea tu app en Meta"
          subtitle="Abre la web de Meta para desarrolladores y crea una app nueva."
        >
          <div className="space-y-4">
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-4 py-3 transition-colors group"
            >
              <span className="text-sm font-semibold text-blue-700">Abrir developers.facebook.com</span>
              <ExternalLink className="h-4 w-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Qué hacer ahí:</p>
              <Step n={1} text={<>Inicia sesión con tu cuenta de <strong>Facebook</strong> (la del negocio)</>} />
              <Step n={2} text={<>Haz clic en el botón verde <strong>"Crear app"</strong></>} />
              <Step n={3} text={<>Elige el tipo <strong>"Empresa"</strong> y haz clic en "Siguiente"</>} />
              <Step n={4} text={<>Ponle un nombre (ej: <strong>AutoPost</strong>) y haz clic en <strong>"Crear app"</strong></>} />
            </div>

            <MockScreen>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                  + Crear app
                </div>
              </div>
            </MockScreen>
          </div>
          <WizardNav
            onBack={() => setWizardStep(1)}
            onNext={() => setWizardStep(3)}
            nextLabel="Ya la creé →"
          />
        </WizardCard>
      )}

      {/* ── Step 3: Activar Instagram ──────────────────────────────── */}
      {wizardStep === 3 && (
        <WizardCard
          icon={<span className="text-2xl">📱</span>}
          title="Activa Instagram en tu app"
          subtitle="Dentro de tu app recién creada, activa el producto de Instagram."
        >
          <div className="space-y-3">
            <Step n={1} text={<>Estás dentro de tu nueva app. Busca la sección <strong>"Agregar productos a tu app"</strong></>} />
            <Step n={2} text={<>Encuentra <strong>"Instagram"</strong> en la lista y haz clic en <strong>"Configurar"</strong></>} />
            <Step n={3} text={<>En el menú izquierdo aparecerá <strong>"Instagram"</strong>. Haz clic en él.</>} />
            <Step n={4} text="Ya está activado. Continúa al siguiente paso." />

            <MockScreen>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600">Agregar productos</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="border border-pink-300 bg-pink-50 rounded-lg p-2 text-center">
                    <div className="text-lg">📸</div>
                    <p className="text-xs font-semibold text-pink-600 mt-1">Instagram</p>
                    <p className="text-xs text-blue-500 underline">Configurar</p>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-2 text-center opacity-40">
                    <div className="text-lg">📘</div>
                    <p className="text-xs font-semibold text-slate-500 mt-1">Messenger</p>
                    <p className="text-xs text-blue-400 underline">Configurar</p>
                  </div>
                </div>
              </div>
            </MockScreen>
          </div>
          <WizardNav
            onBack={() => setWizardStep(2)}
            onNext={() => setWizardStep(4)}
            nextLabel="Ya lo hice →"
          />
        </WizardCard>
      )}

      {/* ── Step 4: Copiar credenciales ────────────────────────────── */}
      {wizardStep === 4 && (
        <WizardCard
          icon={<span className="text-2xl">🔑</span>}
          title="Copia tu App ID y contraseña"
          subtitle="Ve a la configuración básica de tu app y copia los dos valores."
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <Step n={1} text={<>En el menú izquierdo de tu app, haz clic en <strong>"Configuración"</strong> → <strong>"Básica"</strong></>} />
              <Step n={2} text={<>Copia el <strong>App ID</strong> (es un número largo) y pégalo abajo</>} />
              <Step n={3} text={<>Haz clic en <strong>"Mostrar"</strong> junto al App Secret, cópialo y pégalo abajo</>} />
            </div>

            <MockScreen>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">App ID</p>
                  <div className="mt-1 bg-slate-100 rounded px-2 py-1 text-xs font-mono text-slate-700">
                    1234567890123456
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">App Secret</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded px-2 py-1 text-xs font-mono text-slate-700">
                      ••••••••••••••••
                    </div>
                    <span className="text-xs text-blue-500 underline cursor-pointer">Mostrar</span>
                  </div>
                </div>
              </div>
            </MockScreen>

            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  App ID <span className="text-pink-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.META_APP_ID}
                  onChange={(e) => setForm((f) => ({ ...f, META_APP_ID: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="ej: 1234567890123456"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  App Secret <span className="text-pink-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={form.META_APP_SECRET}
                    onChange={(e) => setForm((f) => ({ ...f, META_APP_SECRET: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="Pega aquí el App Secret"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <WizardNav
            onBack={() => setWizardStep(3)}
            onNext={() => setWizardStep(5)}
            nextDisabled={!form.META_APP_ID || !form.META_APP_SECRET}
            nextLabel="Siguiente →"
          />
        </WizardCard>
      )}

      {/* ── Step 5: URL de redirección ─────────────────────────────── */}
      {wizardStep === 5 && (
        <WizardCard
          icon={<span className="text-2xl">🔗</span>}
          title="Añade la URL de redirección"
          subtitle="Último paso: copia esta URL y pégala en tu app de Meta."
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <Step n={1} text={<>En tu app de Meta, ve al menú izquierdo: <strong>Instagram</strong> → <strong>Configuración de Instagram</strong></>} />
              <Step n={2} text={<>Busca el campo <strong>"URIs de redireccionamiento de OAuth válidos"</strong></>} />
              <Step n={3} text={<>Haz clic en <strong>"Añadir URI"</strong> y pega la URL de abajo</>} />
              <Step n={4} text={<>Haz clic en <strong>"Guardar cambios"</strong> en Meta</>} />
            </div>

            <MockScreen>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">URIs de redireccionamiento de OAuth válidos</p>
                <div className="border border-dashed border-pink-300 bg-pink-50 rounded px-2 py-1.5 text-xs font-mono text-pink-700 break-all">
                  {redirectUri || "https://tu-app.railway.app/api/meta/oauth/callback"}
                </div>
                <div className="text-right">
                  <span className="text-xs text-green-600 font-semibold">✓ Guardar cambios</span>
                </div>
              </div>
            </MockScreen>

            {/* URL to copy */}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Tu URL de redirección:</p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                <code className="flex-1 text-xs text-slate-700 break-all font-mono">
                  {redirectUri || "Cargando..."}
                </code>
                {redirectUri && <CopyButton text={redirectUri} />}
              </div>
            </div>

            {saveError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                ⚠️ {saveError}
              </div>
            )}
          </div>

          <WizardNav
            onBack={() => setWizardStep(4)}
            onNext={handleSave}
            nextLabel={saving ? "Guardando..." : "Guardar y terminar ✓"}
            loading={saving}
          />
        </WizardCard>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function WizardCard({
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
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-pink-100 flex items-center justify-center shrink-0">
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

function WizardNav({
  onBack,
  onNext,
  nextLabel = "Siguiente →",
  hideBack = false,
  nextDisabled = false,
  loading = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  hideBack?: boolean;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
      {!hideBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </button>
      )}
      <Button
        onClick={onNext}
        disabled={nextDisabled || loading}
        loading={loading}
        className="flex-1 h-11 gap-1.5 text-sm"
      >
        {nextLabel}
        {!loading && !nextDisabled && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}

function WizardCheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
}

function Credential({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      {ok
        ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="h-3.5 w-3.5" /> Configurado</span>
        : <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><XCircle className="h-3.5 w-3.5" /> Falta</span>
      }
    </div>
  );
}

function SimpleForm({
  form, setForm, showSecret, setShowSecret,
  redirectUri, status, saving, saveError, saveSuccess, onSave,
}: {
  form: { META_APP_ID: string; META_APP_SECRET: string; META_REDIRECT_URI: string };
  setForm: React.Dispatch<React.SetStateAction<{ META_APP_ID: string; META_APP_SECRET: string; META_REDIRECT_URI: string }>>;
  showSecret: boolean;
  setShowSecret: (v: boolean) => void;
  redirectUri: string;
  status: ConfigStatus | null;
  saving: boolean;
  saveError: string;
  saveSuccess: boolean;
  onSave: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">App ID</label>
        <input
          type="text"
          value={form.META_APP_ID}
          onChange={(e) => setForm((f) => ({ ...f, META_APP_ID: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="ej: 1234567890123456"
          autoComplete="off"
        />
        {status?.META_APP_ID && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Ya configurado</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">App Secret</label>
        <p className="text-xs text-slate-400 mb-2">Deja vacío para no cambiar el actual</p>
        <div className="relative">
          <input
            type={showSecret ? "text" : "password"}
            value={form.META_APP_SECRET}
            onChange={(e) => setForm((f) => ({ ...f, META_APP_SECRET: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
            placeholder={status?.META_APP_SECRET ? "••••••••••••••••" : "Pega aquí tu App Secret"}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">URL de redirección</label>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <code className="flex-1 text-xs text-slate-700 font-mono break-all">{redirectUri}</code>
          <CopyButton text={redirectUri} />
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {saveError}</div>
      )}
      {saveSuccess && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">✓ Guardado correctamente</div>
      )}

      <Button onClick={onSave} loading={saving} className="w-full h-11">
        Guardar cambios
      </Button>
    </div>
  );
}
