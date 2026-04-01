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

// ─── Health check types ───────────────────────────────────────────────────────
interface HealthCheck {
  ok: boolean;
  checks: {
    encryption_key: { ok: boolean; detail: string };
    database: { ok: boolean; detail: string };
    meta_credentials: { ok: boolean; detail: string };
  };
}

// ─── Health panel ────────────────────────────────────────────────────────────
function HealthPanel({ health, onClose }: { health: HealthCheck; onClose: () => void }) {
  if (health.ok) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-red-800 flex items-center gap-2">
          <XCircle className="h-4 w-4" /> Diagnóstico del servidor
        </p>
        <button onClick={onClose} className="text-red-400 hover:text-red-600 text-xs">Ocultar</button>
      </div>
      <div className="space-y-2">
        <HealthRow label="Clave de cifrado (ENCRYPTION_KEY)" check={health.checks.encryption_key} />
        <HealthRow label="Base de datos (DATABASE_URL)" check={health.checks.database} />
        <HealthRow label="Credenciales de Meta" check={health.checks.meta_credentials} />
      </div>
      {!health.checks.encryption_key.ok && (
        <div className="bg-white border border-red-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold text-red-700">Cómo arreglar ENCRYPTION_KEY en Railway:</p>
          <ol className="text-xs text-red-600 space-y-1 list-decimal ml-4">
            <li>Abre tu proyecto en Railway</li>
            <li>Haz clic en tu servicio web → <strong>Variables</strong></li>
            <li>Añade la variable: <code className="bg-red-100 px-1 rounded font-mono">ENCRYPTION_KEY</code></li>
            <li>Como valor, copia exactamente esto (64 caracteres):</li>
          </ol>
          <div className="flex items-center gap-2 bg-red-100 rounded-lg px-3 py-2 mt-1">
            <code className="flex-1 text-xs font-mono text-red-800 break-all">
              {Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("")}
            </code>
            <CopyButton text={Array.from({ length: 32 }, (_, i) => ((i * 37 + 91) % 256).toString(16).padStart(2, "0")).join("")} />
          </div>
          <p className="text-xs text-red-500">⚠️ Usa tu propio valor generado con: <code className="bg-red-100 px-1 rounded font-mono">openssl rand -hex 32</code></p>
        </div>
      )}
    </div>
  );
}

function HealthRow({ label, check }: { label: string; check: { ok: boolean; detail: string } }) {
  return (
    <div className="flex items-start gap-2.5">
      {check.ok
        ? <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
      <div>
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        {!check.ok && <p className="text-xs text-red-600 mt-0.5">{check.detail}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [showHealth, setShowHealth] = useState(false);
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
    // Run health check automatically
    fetch("/api/health").then(r => r.json()).then((data: HealthCheck) => {
      setHealth(data);
      if (!data.ok) setShowHealth(true);
    }).catch(() => {});
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
  const TOTAL_STEPS = 7;

  // ── Already configured ───────────────────────────────────────────────────
  if (allConfigured && !editing) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-500 mt-1">Conexión con Meta</p>
        </div>

        {health && showHealth && <HealthPanel health={health} onClose={() => setShowHealth(false)} />}

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

      {health && showHealth && <HealthPanel health={health} onClose={() => setShowHealth(false)} />}

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
              <div>
                <span className="text-sm font-semibold text-blue-700">Abrir developers.facebook.com</span>
                <p className="text-xs text-blue-500 mt-0.5">Se abre en una nueva pestaña</p>
              </div>
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

      {/* ── Step 3: Añadir productos ─────────────────────────────── */}
      {wizardStep === 3 && (
        <WizardCard
          icon={<span className="text-2xl">📱</span>}
          title="Añade dos productos a tu app"
          subtitle="Tu app necesita dos cosas activadas: Instagram y Inicio de sesión con Facebook."
        >
          <div className="space-y-3">
            <Step n={1} text={<>Estás dentro de tu nueva app. Busca la sección <strong>"Agregar productos a tu app"</strong> (aparece en el panel principal).</>} />
            <Step n={2} text={<>Encuentra <strong>"Instagram"</strong> y haz clic en <strong>"Configurar"</strong>.</>} />
            <Step n={3} text={<>Ahora busca también <strong>"Inicio de sesión con Facebook"</strong> y haz clic en <strong>"Configurar"</strong>.</>} />
            <Step n={4} text={<>Cuando los dos aparezcan en el menú de la izquierda, ya puedes continuar.</>} />

            <MockScreen>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-600">Agregar productos</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="border-2 border-pink-400 bg-pink-50 rounded-lg p-2 text-center">
                    <div className="text-lg">📸</div>
                    <p className="text-xs font-semibold text-pink-600 mt-1">Instagram</p>
                    <p className="text-xs text-blue-500 underline">Configurar</p>
                  </div>
                  <div className="border-2 border-pink-400 bg-pink-50 rounded-lg p-2 text-center">
                    <div className="text-lg">🔑</div>
                    <p className="text-xs font-semibold text-pink-600 mt-1">Inicio sesión FB</p>
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

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700">
                <strong>Necesitas los dos:</strong> "Instagram" para publicar fotos, y "Inicio de sesión con Facebook" para conectar cuentas.
              </p>
            </div>
          </div>
          <WizardNav
            onBack={() => setWizardStep(2)}
            onNext={() => setWizardStep(4)}
            nextLabel="Ya los añadí →"
          />
        </WizardCard>
      )}

      {/* ── Step 4: Activar permisos en Casos de uso ──────────────── */}
      {wizardStep === 4 && (
        <WizardCard
          icon={<span className="text-2xl">✅</span>}
          title="Activa los permisos de Instagram"
          subtitle='Ve a "Casos de uso" y personaliza el caso de Instagram.'
        >
          <div className="space-y-4">
            <div className="space-y-3">
              <Step n={1} text={
                <>En el menú de la izquierda, haz clic en <strong>"Casos de uso"</strong>.</>
              } />
              <Step n={2} text={
                <>Verás una tarjeta que dice <strong>"Administrar mensajes y contenido en Instagram"</strong>. Haz clic en el botón <strong>"Personalizar"</strong> de esa tarjeta.</>
              } />
              <Step n={3} text={
                <>Se abre una lista de permisos. Asegúrate de que estos estén <strong>activados</strong> (con la palanca encendida):</>
              } />
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-700">instagram_business_basic</span>
                <span className="text-xs text-green-600 font-bold">Activar</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-700">instagram_business_content_publish</span>
                <span className="text-xs text-green-600 font-bold">Activar</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-700">instagram_business_manage_comments</span>
                <span className="text-xs text-green-600 font-bold">Activar</span>
              </div>
            </div>

            {/* Mockup */}
            <MockScreen>
              <div className="flex gap-0 -m-4">
                {/* Sidebar */}
                <div className="w-[160px] bg-slate-50 border-r border-slate-200 p-3 space-y-1 shrink-0">
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Panel</div>
                  <div className="px-2 py-1.5 rounded text-[11px] font-bold text-pink-700 bg-pink-100 border border-pink-300">
                    → Casos de uso
                  </div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Instagram</div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Inicio sesión FB</div>
                </div>
                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-700">Casos de uso</p>
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📸</span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-700">Administrar mensajes y contenido en Instagram</p>
                          <p className="text-[10px] text-slate-400">Publica, comenta, etc.</p>
                        </div>
                      </div>
                      <div className="bg-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                        Personalizar
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </MockScreen>

            <Step n={4} text={
              <>Después de activar los permisos, haz clic en <strong>"Guardar"</strong> si aparece el botón. Luego continúa aquí.</>
            } />

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-700">
                <strong>Si ya ves "Test en curso" en el caso de uso:</strong> perfecto, los permisos ya están activos. Puedes continuar.
              </p>
            </div>
          </div>
          <WizardNav
            onBack={() => setWizardStep(3)}
            onNext={() => setWizardStep(5)}
            nextLabel="Ya los activé →"
          />
        </WizardCard>
      )}

      {/* ── Step 5: Copiar credenciales ────────────────────────────── */}
      {wizardStep === 5 && (
        <WizardCard
          icon={<span className="text-2xl">🔑</span>}
          title="Copia dos datos de tu app"
          subtitle="Necesitamos el App ID y el App Secret. Te mostramos exactamente dónde encontrarlos."
        >
          <div className="space-y-4">
            {/* Big clear warning */}
            <div className="bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-red-700 mb-1">
                CUIDADO: Ve a la página correcta
              </p>
              <p className="text-xs text-red-600 leading-relaxed">
                Meta tiene muchas páginas con números parecidos. Solo hay <strong>UN lugar correcto</strong> para encontrar los datos que necesitas.
                No vayas a "Casos de uso", ni a "API de Instagram", ni a "Productos".
                Ve SOLO a donde te decimos abajo.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sigue estos pasos:</p>
              <Step n={1} text={
                <>Mira la <strong>barra de la izquierda</strong> de tu app en Meta (el menú lateral).</>
              } />
              <Step n={2} text={
                <>Busca la opción que dice <strong>"Configuración de la aplicación"</strong>. Tiene un icono de engranaje ⚙️. Haz clic ahí.</>
              } />
              <Step n={3} text={
                <>Se abre un submenú. Haz clic en <strong>"Información básica"</strong>. Es la primera opción del submenú.</>
              } />
              <Step n={4} text={
                <>Busca el campo <strong>"Identificador de la app"</strong> (un número largo). Cópialo y pégalo abajo.</>
              } />
              <Step n={5} text={
                <>Más abajo verás <strong>"Clave secreta de la app"</strong>. Haz clic en <strong>"Mostrar"</strong> para verla. Te pedirá tu contraseña de Facebook. Luego cópiala y pégala abajo.</>
              } />
            </div>

            {/* Detailed mockup: sidebar + content */}
            <MockScreen>
              <div className="flex gap-0 -m-4">
                {/* Sidebar mock */}
                <div className="w-[180px] bg-slate-50 border-r border-slate-200 p-3 space-y-1 shrink-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Menú de tu app</p>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Panel</div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Casos de uso</div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Instagram</div>
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <div className="px-2 py-1.5 rounded text-[11px] font-bold text-pink-700 bg-pink-100 border border-pink-300 flex items-center gap-1">
                      ⚙️ Config. de la app
                      <span className="text-pink-500 ml-auto">▼</span>
                    </div>
                    <div className="ml-3 mt-1 space-y-0.5">
                      <div className="px-2 py-1 rounded text-[11px] font-bold text-white bg-pink-500 flex items-center gap-1">
                        → Info. básica
                      </div>
                      <div className="px-2 py-1 rounded text-[11px] text-slate-400">Avanzada</div>
                    </div>
                  </div>
                </div>
                {/* Content area */}
                <div className="flex-1 p-4 space-y-4">
                  <p className="text-xs font-bold text-slate-700">Información básica</p>

                  {/* App ID field */}
                  <div className="relative">
                    <p className="text-[10px] text-slate-500 mb-1">Identificador de la app</p>
                    <div className="bg-green-50 border-2 border-green-400 rounded px-2 py-1.5 text-xs font-mono text-green-800 font-bold flex items-center justify-between">
                      <span>1234567890123456</span>
                    </div>
                    <div className="absolute -right-1 top-3 flex items-center gap-1">
                      <span className="text-green-600 text-lg font-bold animate-pulse">←</span>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">COPIA ESTE</span>
                    </div>
                  </div>

                  {/* App Secret field */}
                  <div className="relative">
                    <p className="text-[10px] text-slate-500 mb-1">Clave secreta de la app</p>
                    <div className="bg-green-50 border-2 border-green-400 rounded px-2 py-1.5 flex items-center gap-2">
                      <span className="text-xs font-mono text-green-800">••••••••••••••••</span>
                      <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded font-bold cursor-pointer">Mostrar</span>
                    </div>
                    <div className="absolute -right-1 top-3 flex items-center gap-1">
                      <span className="text-green-600 text-lg font-bold animate-pulse">←</span>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Y ESTE</span>
                    </div>
                  </div>

                  {/* Wrong fields */}
                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <p className="text-[10px] font-bold text-red-500">Estos NO son los que necesitas:</p>
                    <div className="opacity-50">
                      <div className="bg-red-50 border border-red-200 rounded px-2 py-1 text-[10px] text-red-400 line-through">
                        Identificador de la app de Instagram: 9876543...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </MockScreen>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700">
                <strong>Truco:</strong> El App ID es un número de unos 15-16 dígitos.
                El App Secret es una mezcla de letras y números (como una contraseña larga).
                Si lo que ves no se parece a eso, estás en la página equivocada.
              </p>
            </div>

            {/* Input fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  App ID <span className="text-pink-500">*</span>
                  <span className="text-slate-400 font-normal ml-1">(el número largo)</span>
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
                  <span className="text-slate-400 font-normal ml-1">(la clave secreta)</span>
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
            onBack={() => setWizardStep(4)}
            onNext={() => setWizardStep(6)}
            nextDisabled={!form.META_APP_ID || !form.META_APP_SECRET}
            nextLabel="Siguiente →"
          />
        </WizardCard>
      )}

      {/* ── Step 6: URL de redirección en Instagram API ───────────── */}
      {wizardStep === 6 && (
        <WizardCard
          icon={<span className="text-2xl">🔗</span>}
          title="Pega la URL de redirección en Instagram"
          subtitle="Hay que pegar la misma URL en dos sitios de Meta. Este es el primero."
        >
          <div className="space-y-4">
            {/* URL to copy */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">Primero, copia esta dirección:</p>
              <div className="flex items-center gap-2 bg-pink-50 border-2 border-pink-300 rounded-xl px-3 py-3">
                <code className="flex-1 text-xs text-pink-800 break-all font-mono font-bold">
                  {redirectUri || "Cargando..."}
                </code>
                {redirectUri && <CopyButton text={redirectUri} />}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-amber-700 mb-1">
                SITIO 1 DE 2: Configuración de la API de Instagram
              </p>
              <p className="text-xs text-amber-600">
                Primero vamos a pegar la URL en la sección de Instagram de tu app.
              </p>
            </div>

            <div className="space-y-3">
              <Step n={1} text={
                <>En el menú de la izquierda, haz clic en <strong>"Casos de uso"</strong>.</>
              } />
              <Step n={2} text={
                <>Haz clic en <strong>"Personalizar"</strong> en la tarjeta de Instagram.</>
              } />
              <Step n={3} text={
                <>Dentro, busca la sección <strong>"Configuración"</strong> o <strong>"Settings"</strong>.</>
              } />
              <Step n={4} text={
                <>Busca el campo <strong>"URIs de redireccionamiento de OAuth válidos"</strong> (o "Valid OAuth redirect URIs").</>
              } />
              <Step n={5} text={
                <>Pega la URL que copiaste arriba y haz clic en <strong>"Guardar"</strong>.</>
              } />
            </div>

            <MockScreen>
              <div className="flex gap-0 -m-4">
                <div className="w-[160px] bg-slate-50 border-r border-slate-200 p-3 space-y-1 shrink-0">
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Panel</div>
                  <div className="px-2 py-1.5 rounded text-[11px] font-bold text-pink-700 bg-pink-100 border border-pink-300">
                    → Casos de uso
                  </div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Instagram</div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Inicio sesión FB</div>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-700">Instagram → Personalizar → Configuración</p>
                  <div className="relative">
                    <p className="text-[10px] text-slate-500 mb-1">URIs de redireccionamiento de OAuth válidos</p>
                    <div className="bg-green-50 border-2 border-green-400 rounded px-2 py-2 text-[10px] font-mono text-green-800 font-bold break-all">
                      {redirectUri || "https://tu-app.railway.app/api/meta/oauth/callback"}
                    </div>
                    <div className="absolute -right-1 top-3 flex items-center gap-1">
                      <span className="text-green-600 text-lg font-bold animate-pulse">←</span>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">PEGA AQUÍ</span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded">Guardar</div>
                  </div>
                </div>
              </div>
            </MockScreen>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700">
                <strong>No encuentras la sección?</strong> A veces está dentro de "Casos de uso → Personalizar" como pestaña "Configuración" o al final de la lista de permisos.
                Si no la ves, pasa al siguiente paso igualmente.
              </p>
            </div>
          </div>
          <WizardNav
            onBack={() => setWizardStep(5)}
            onNext={() => setWizardStep(7)}
            nextLabel="Siguiente →"
          />
        </WizardCard>
      )}

      {/* ── Step 7: URL de redirección en Facebook Login + guardar ── */}
      {wizardStep === 7 && (
        <WizardCard
          icon={<span className="text-2xl">🔗</span>}
          title="Pega la URL también en Facebook Login"
          subtitle="Segundo y último sitio donde pegar la URL. Después guardamos."
        >
          <div className="space-y-4">
            {/* URL reminder */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">La misma URL de antes:</p>
              <div className="flex items-center gap-2 bg-pink-50 border-2 border-pink-300 rounded-xl px-3 py-3">
                <code className="flex-1 text-xs text-pink-800 break-all font-mono font-bold">
                  {redirectUri || "Cargando..."}
                </code>
                {redirectUri && <CopyButton text={redirectUri} />}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-amber-700 mb-1">
                SITIO 2 DE 2: Inicio de sesión con Facebook
              </p>
              <p className="text-xs text-amber-600">
                Ahora pégala en la configuración de Facebook Login.
              </p>
            </div>

            <div className="space-y-3">
              <Step n={1} text={
                <>En el menú de la izquierda, haz clic en <strong>"Inicio de sesión con Facebook"</strong>.</>
              } />
              <Step n={2} text={
                <>Haz clic en <strong>"Configuración"</strong> (debajo de "Inicio de sesión con Facebook").</>
              } />
              <Step n={3} text={
                <>Busca el campo <strong>"URIs de redireccionamiento de OAuth válidos"</strong>.</>
              } />
              <Step n={4} text={
                <>Pega la URL y haz clic en <strong>"Guardar cambios"</strong>.</>
              } />
            </div>

            {/* Mockup */}
            <MockScreen>
              <div className="flex gap-0 -m-4">
                <div className="w-[170px] bg-slate-50 border-r border-slate-200 p-3 space-y-1 shrink-0">
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Panel</div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Casos de uso</div>
                  <div className="px-2 py-1.5 rounded text-[11px] text-slate-400">Instagram</div>
                  <div className="mt-2 border-t border-slate-200 pt-2">
                    <div className="px-2 py-1.5 rounded text-[11px] font-bold text-pink-700 bg-pink-100 border border-pink-300 flex items-center gap-1">
                      f Inicio sesión FB
                      <span className="text-pink-500 ml-auto">▼</span>
                    </div>
                    <div className="ml-3 mt-1">
                      <div className="px-2 py-1 rounded text-[11px] font-bold text-white bg-pink-500">
                        → Configuración
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-700">Configuración de inicio de sesión con Facebook</p>
                  <div className="relative">
                    <p className="text-[10px] text-slate-500 mb-1">URIs de redireccionamiento de OAuth válidos</p>
                    <div className="bg-green-50 border-2 border-green-400 rounded px-2 py-2 text-[10px] font-mono text-green-800 font-bold break-all">
                      {redirectUri || "https://tu-app.railway.app/api/meta/oauth/callback"}
                    </div>
                    <div className="absolute -right-1 top-3 flex items-center gap-1">
                      <span className="text-green-600 text-lg font-bold animate-pulse">←</span>
                      <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">PEGA AQUÍ</span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded">Guardar cambios</div>
                  </div>
                </div>
              </div>
            </MockScreen>

            {saveError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Guardado. Ya puedes conectar tu cuenta de Instagram.
              </div>
            )}
          </div>

          <WizardNav
            onBack={() => setWizardStep(6)}
            onNext={handleSave}
            nextLabel={saving ? "Guardando..." : "Guardar y terminar"}
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
