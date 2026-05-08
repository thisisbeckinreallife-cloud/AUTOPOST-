"use client";

import { useState } from "react";

export function DangerZoneSection({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatch = confirmEmail.trim().toLowerCase() === email.toLowerCase();

  async function onDelete() {
    if (!isMatch || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Error al eliminar la cuenta");
      // Logout + redirect
      window.location.href = "/login?deleted=1";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="danger-heading" className="bg-ink-2 border border-error/30 rounded-md p-8">
      <header className="mb-6">
        <h2 id="danger-heading" className="text-xl font-semibold text-error-strong tracking-tight mb-1">
          Zona de peligro
        </h2>
        <p className="text-sm text-ink-7">
          Acciones irreversibles. Léelas con calma.
        </p>
      </header>

      {!open ? (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-9">Eliminar cuenta</p>
            <p className="text-xs text-ink-7 mt-0.5">
              Borra tu perfil, conexiones a redes y datos. La suscripción
              activa se cancela. Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center h-11 px-4 rounded-md border border-error/40 text-error-strong font-medium text-sm hover:bg-error/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
          >
            Eliminar cuenta
          </button>
        </div>
      ) : (
        <div className="bg-error/10 border border-error/30 rounded-md p-5">
          <p className="text-sm text-ink-9 mb-4">
            Para confirmar, escribe tu email{" "}
            <code className="bg-ink-1 px-1.5 py-0.5 rounded text-xs font-mono text-ink-9">{email}</code>
            {" "}exactamente igual.
          </p>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="off"
            className="w-full h-11 px-3 rounded-md bg-ink-1 border border-ink-4 text-sm text-ink-9 placeholder:text-ink-6 focus-visible:outline-none focus-visible:border-error focus-visible:ring-2 focus-visible:ring-error/40 transition-colors mb-4"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={onDelete}
              disabled={!isMatch || deleting}
              className="inline-flex items-center justify-center h-11 px-4 rounded-md bg-error text-ink-9 font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              {deleting ? "Eliminando…" : "Sí, eliminar definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirmEmail(""); setError(null); }}
              className="inline-flex items-center justify-center h-11 px-4 rounded-md border border-ink-4 text-ink-9 font-medium text-sm hover:bg-ink-3 transition-all"
            >
              Cancelar
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-error-strong">{error}</p>
          ) : null}
        </div>
      )}
    </section>
  );
}
