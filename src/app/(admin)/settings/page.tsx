"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, EyeOff, ExternalLink, HelpCircle } from "lucide-react";

interface ConfigStatus {
  META_APP_ID: boolean;
  META_APP_SECRET: boolean;
  META_REDIRECT_URI: boolean;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [form, setForm] = useState({
    META_APP_ID: "",
    META_APP_SECRET: "",
    META_REDIRECT_URI: typeof window !== "undefined"
      ? `${window.location.origin}/api/meta/oauth/callback` : "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  async function loadStatus() {
    const res = await fetch("/api/settings/meta");
    if (res.ok) {
      const data = await res.json();
      setStatus(data.data);
    }
  }

  useEffect(() => {
    loadStatus();
    setForm((f) => ({ ...f, META_REDIRECT_URI: `${window.location.origin}/api/meta/oauth/callback` }));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/settings/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar. Inténtalo de nuevo.");
        return;
      }
      setSuccess(true);
      setForm((f) => ({ ...f, META_APP_SECRET: "" }));
      await loadStatus();
    } catch {
      setError("Error de red. Comprueba tu conexión.");
    } finally {
      setSaving(false);
    }
  }

  const allConfigured = status?.META_APP_ID && status?.META_APP_SECRET && status?.META_REDIRECT_URI;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-1">Conecta AutoPost con tu app de Meta</p>
      </div>

      {/* Status */}
      {status && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${allConfigured ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          {allConfigured
            ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            : <XCircle className="h-5 w-5 text-amber-500 shrink-0" />}
          <p className="text-sm font-medium text-slate-800">
            {allConfigured ? "Tu app de Meta está configurada correctamente" : "Faltan datos de tu app de Meta para poder publicar"}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              ID de la aplicación
            </label>
            <p className="text-xs text-slate-400 mb-2">El número identificador de tu app en Meta</p>
            <input
              type="text"
              required
              value={form.META_APP_ID}
              onChange={(e) => setForm((f) => ({ ...f, META_APP_ID: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
              placeholder="ej: 1234567890123456"
              autoComplete="off"
            />
            {status?.META_APP_ID && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Ya configurado</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Contraseña secreta de la app
            </label>
            <p className="text-xs text-slate-400 mb-2">Se guarda de forma segura y cifrada, nunca la verás de nuevo</p>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                required
                value={form.META_APP_SECRET}
                onChange={(e) => setForm((f) => ({ ...f, META_APP_SECRET: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder={status?.META_APP_SECRET ? "••••••••••••••••" : "Pega aquí tu App Secret"}
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
            {status?.META_APP_SECRET && !form.META_APP_SECRET && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Ya configurado. Deja vacío para no cambiar.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              URL de redirección
            </label>
            <p className="text-xs text-slate-400 mb-2">Cópiala y pégala en tu app de Meta (Facebook Login → Valid OAuth Redirect URIs)</p>
            <input
              type="url"
              required
              value={form.META_REDIRECT_URI}
              onChange={(e) => setForm((f) => ({ ...f, META_REDIRECT_URI: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              ✓ Configuración guardada correctamente
            </div>
          )}

          <Button type="submit" loading={saving} className="w-full h-11">
            Guardar configuración
          </Button>
        </form>
      </div>

      {/* Help */}
      <div className="bg-slate-50 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-slate-400" />
            ¿Cómo consigo estos datos?
          </span>
          <span className="text-slate-400">{showHelp ? "▲" : "▼"}</span>
        </button>
        {showHelp && (
          <div className="px-4 pb-4 border-t border-slate-200 pt-4 space-y-3">
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-bold text-pink-500 shrink-0">1.</span> Ve a <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-pink-500 underline inline-flex items-center gap-0.5">developers.facebook.com/apps <ExternalLink className="h-3 w-3" /></a> y crea una app de tipo <strong>Business</strong></li>
              <li className="flex gap-2"><span className="font-bold text-pink-500 shrink-0">2.</span> En <em>Configuración básica</em>, copia el <strong>App ID</strong> y el <strong>App Secret</strong></li>
              <li className="flex gap-2"><span className="font-bold text-pink-500 shrink-0">3.</span> Añade el producto <strong>Instagram Graph API</strong></li>
              <li className="flex gap-2"><span className="font-bold text-pink-500 shrink-0">4.</span> En <em>Facebook Login → Configuración</em>, pega la URL de redirección que ves arriba</li>
              <li className="flex gap-2"><span className="font-bold text-pink-500 shrink-0">5.</span> Solicita el permiso <code className="bg-slate-100 px-1 rounded text-xs">instagram_content_publish</code> para publicar en cuentas reales</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
