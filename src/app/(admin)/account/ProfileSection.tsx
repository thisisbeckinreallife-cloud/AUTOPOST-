"use client";

import { useState } from "react";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  provider: string;
  emailVerified: boolean;
  createdAt: string;
}

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileSection({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = name.trim() !== (profile.name ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="profile-heading" className="bg-ink-2 border border-ink-4 rounded-md p-8">
      <header className="mb-6">
        <h2 id="profile-heading" className="text-xl font-semibold text-ink-9 tracking-tight mb-1">
          Perfil
        </h2>
        <p className="text-sm text-ink-7">Cómo te identificamos en Autopost.</p>
      </header>

      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-ink-3">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-semibold text-ink-0 shrink-0 overflow-hidden">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            (profile.name ?? profile.email).slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-ink-9 truncate">
            {profile.name ?? profile.email}
          </p>
          <p className="text-sm text-ink-7 mt-0.5">
            Miembro desde {formatJoinDate(profile.createdAt)}
            {profile.provider === "google" ? " · Cuenta Google" : ""}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-ink-8 mb-2">
            Nombre
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={100}
            className="w-full h-11 px-3 rounded-md bg-ink-1 border border-ink-4 text-sm text-ink-9 placeholder:text-ink-6 hover:border-ink-5 focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-ring transition-colors"
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium text-ink-8 mb-2">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="w-full h-11 px-3 rounded-md bg-ink-1 border border-ink-4 text-sm text-ink-7 cursor-not-allowed"
          />
          <p className="text-xs text-ink-7 mt-2">
            {profile.emailVerified ? (
              <span className="text-success-strong">✓ Verificado</span>
            ) : (
              <span className="text-warning-strong">Email no verificado</span>
            )}
            {" · "}
            Para cambiar el email, contacta soporte.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="inline-flex items-center justify-center h-11 px-4 rounded-md bg-accent text-ink-0 font-medium text-sm shadow-md hover:bg-accent-hover transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          {saved ? <span className="text-sm text-success-strong">✓ Guardado</span> : null}
          {error ? <span role="alert" className="text-sm text-error-strong">{error}</span> : null}
        </div>
      </form>
    </section>
  );
}
