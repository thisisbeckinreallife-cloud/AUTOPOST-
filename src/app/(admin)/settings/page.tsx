"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye, EyeOff, Info, ExternalLink } from "lucide-react";

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
    META_REDIRECT_URI:
      typeof window !== "undefined"
        ? `${window.location.origin}/api/meta/oauth/callback`
        : "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    const res = await fetch("/api/settings/meta");
    if (res.ok) {
      const data = await res.json();
      setStatus(data.data);
    }
  }

  useEffect(() => {
    loadStatus();
    setForm((f) => ({
      ...f,
      META_REDIRECT_URI: `${window.location.origin}/api/meta/oauth/callback`,
    }));
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
        setError(data.error ?? "Error saving");
        return;
      }
      setSuccess(true);
      setForm((f) => ({ ...f, META_APP_SECRET: "" })); // Clear secret from form
      await loadStatus();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove Meta App configuration from database? Env vars will be used as fallback.")) return;
    const res = await fetch("/api/settings/meta", { method: "DELETE" });
    if (res.ok) await loadStatus();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Platform configuration</p>
      </div>

      {/* Meta App Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Meta App Configuration
            </CardTitle>
            {status && (
              <div className="flex items-center gap-2 text-sm">
                {status.META_APP_ID && status.META_APP_SECRET && status.META_REDIRECT_URI ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600">
                    <XCircle className="h-4 w-4" /> Not configured
                  </span>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Where to get these */}
          <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Obtén estos datos en{" "}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline inline-flex items-center gap-1"
                >
                  developers.facebook.com/apps
                  <ExternalLink className="h-3 w-3" />
                </a>
                . Tu app necesita el permiso{" "}
                <code className="bg-blue-100 px-1 rounded">instagram_content_publish</code>{" "}
                aprobado por Meta App Review para publicar en cuentas reales.
              </div>
            </div>
          </div>

          {/* Current status per key */}
          {status && (
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(status) as [keyof ConfigStatus, boolean][]).map(
                ([key, configured]) => (
                  <div
                    key={key}
                    className={`rounded-md border px-3 py-2 text-xs font-mono flex items-center gap-1.5 ${
                      configured
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {configured ? (
                      <CheckCircle className="h-3 w-3 shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 shrink-0" />
                    )}
                    {key}
                  </div>
                )
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                App ID
              </label>
              <input
                type="text"
                required
                value={form.META_APP_ID}
                onChange={(e) =>
                  setForm((f) => ({ ...f, META_APP_ID: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="1234567890123456"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                App Secret
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  (guardado cifrado con AES-256-GCM)
                </span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  required
                  value={form.META_APP_SECRET}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, META_APP_SECRET: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={status?.META_APP_SECRET ? "••••••••••••••••" : "Introduce el App Secret"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {status?.META_APP_SECRET && !form.META_APP_SECRET && (
                <p className="text-xs text-green-600 mt-1">
                  Ya configurado. Deja vacío para mantener el actual.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                OAuth Redirect URI
              </label>
              <input
                type="url"
                required
                value={form.META_REDIRECT_URI}
                onChange={(e) =>
                  setForm((f) => ({ ...f, META_REDIRECT_URI: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="https://tudominio.com/api/meta/oauth/callback"
              />
              <p className="text-xs text-slate-400 mt-1">
                Añade esta URL exacta en Meta App → Facebook Login → Valid OAuth Redirect URIs
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                Configuración guardada correctamente.
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>
                Guardar configuración
              </Button>
              {(status?.META_APP_ID || status?.META_APP_SECRET) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemove}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Eliminar de DB
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cómo obtener las credenciales</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-3">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Ve a{" "}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline"
              >
                developers.facebook.com/apps
              </a>{" "}
              y crea una app de tipo <strong>Business</strong>
            </li>
            <li>
              Añade el producto <strong>Instagram Graph API</strong>
            </li>
            <li>
              En <em>Configuración básica</em>, copia el <strong>App ID</strong> y el{" "}
              <strong>App Secret</strong>
            </li>
            <li>
              En <em>Facebook Login → Configuración</em>, añade la{" "}
              <strong>Redirect URI</strong> que aparece arriba
            </li>
            <li>
              Solicita el permiso{" "}
              <code className="bg-slate-100 px-1 rounded">instagram_content_publish</code>{" "}
              mediante <strong>App Review</strong> para publicar en cuentas reales
            </li>
          </ol>
          <p className="text-xs text-slate-400 pt-2">
            El App Secret se almacena cifrado con AES-256-GCM y nunca se expone al frontend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
