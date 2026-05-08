"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Profile {
  id: string;
  email: string;
  provider: string;
}

export function SecuritySection({ profile }: { profile: Profile }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isGoogleOnly = profile.provider === "google";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPw.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cambiar la contraseña");
      setSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="security-heading" className="bg-ink-2 border border-ink-4 rounded-md p-8">
      <header className="mb-6">
        <h2 id="security-heading" className="text-xl font-semibold text-ink-9 tracking-tight mb-1">
          Seguridad
        </h2>
        <p className="text-sm text-ink-7">Contraseña y cierre de sesión.</p>
      </header>

      {isGoogleOnly ? (
        <div className="bg-ink-1 border border-ink-3 rounded-md p-4 mb-6">
          <p className="text-sm text-ink-8">
            Has iniciado sesión con Google. Si quieres usar también email + contraseña,
            haz clic en{" "}
            <a href="/forgot-password" className="text-accent underline hover:text-accent-strong">
              "Olvidé contraseña"
            </a>{" "}
            para crear una.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4 mb-6">
          <PasswordField
            id="current-pw"
            label="Contraseña actual"
            value={currentPw}
            onChange={setCurrentPw}
            show={showPw}
            onToggle={() => setShowPw(!showPw)}
            autoComplete="current-password"
            required
          />
          <PasswordField
            id="new-pw"
            label="Nueva contraseña"
            value={newPw}
            onChange={setNewPw}
            show={showPw}
            onToggle={() => setShowPw(!showPw)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <PasswordField
            id="confirm-pw"
            label="Confirma la nueva"
            value={confirmPw}
            onChange={setConfirmPw}
            show={showPw}
            onToggle={() => setShowPw(!showPw)}
            autoComplete="new-password"
            required
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !currentPw || !newPw || !confirmPw}
              className="inline-flex items-center justify-center h-11 px-4 rounded-md bg-accent text-ink-0 font-medium text-sm shadow-md hover:bg-accent-hover transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? "Cambiando…" : "Cambiar contraseña"}
            </button>
            {success ? <span className="text-sm text-success-strong">✓ Contraseña actualizada</span> : null}
            {error ? <span role="alert" className="text-sm text-error-strong">{error}</span> : null}
          </div>
        </form>
      )}

      <div className="pt-6 border-t border-ink-3">
        <p className="text-sm font-medium text-ink-9 mb-2">Cerrar sesión</p>
        <p className="text-xs text-ink-7 mb-3">
          Termina la sesión actual en este dispositivo.
        </p>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center justify-center h-11 px-4 rounded-md border border-ink-4 text-ink-9 font-medium text-sm hover:bg-ink-3 hover:border-ink-5 transition-all"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </section>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  required,
  minLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-8 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full h-11 pl-3 pr-10 rounded-md bg-ink-1 border border-ink-4 text-sm text-ink-9 placeholder:text-ink-6 hover:border-ink-5 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-ring transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={show}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 inline-flex items-center justify-center text-ink-6 hover:text-ink-9 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
