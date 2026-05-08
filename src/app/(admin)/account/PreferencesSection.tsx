"use client";

import { useState } from "react";
import Link from "next/link";

interface Preferences {
  language: string;
  hideWatermark: boolean;
  emailNotifications: boolean;
}

export function PreferencesSection({
  preferences: initial,
  hasWatermark,
}: {
  preferences: Preferences;
  /** true si el plan actual lleva marca "Programado con autopost.app". */
  hasWatermark: boolean;
}) {
  const [language, setLanguage] = useState(initial.language);
  const [emailNotifications, setEmailNotifications] = useState(initial.emailNotifications);
  const [saving, setSaving] = useState(false);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(data: Partial<Preferences>, fieldLabel: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      setSavedField(fieldLabel);
      setTimeout(() => setSavedField(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  function onLanguageChange(value: "es" | "en") {
    setLanguage(value);
    void patch({ language: value }, "Idioma");
  }

  function onEmailChange(value: boolean) {
    setEmailNotifications(value);
    void patch({ emailNotifications: value }, "Notificaciones");
  }

  return (
    <section aria-labelledby="prefs-heading" className="bg-ink-2 border border-ink-4 rounded-md p-8">
      <header className="mb-6">
        <h2 id="prefs-heading" className="text-xl font-semibold text-ink-9 tracking-tight mb-1">
          Preferencias
        </h2>
        <p className="text-sm text-ink-7">Idioma, notificaciones y marca de agua.</p>
      </header>

      <div className="flex flex-col divide-y divide-ink-3">
        {/* Idioma */}
        <div className="py-4 first:pt-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-ink-9">Idioma</p>
              <p className="text-xs text-ink-7 mt-0.5">Para emails y la interfaz.</p>
            </div>
            <div className="inline-flex p-1 bg-ink-1 border border-ink-3 rounded-full">
              <button
                type="button"
                onClick={() => onLanguageChange("es")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  language === "es" ? "bg-accent text-ink-0" : "text-ink-7 hover:text-ink-9"
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange("en")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  language === "en" ? "bg-accent text-ink-0" : "text-ink-7 hover:text-ink-9"
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        {/* Marca de agua — solo informativo. La regla es automática:
            FREE lleva watermark · cualquier plan de pago no la lleva. */}
        <div className="py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-9">
                Marca "Programado con autopost.app"
              </p>
              {hasWatermark ? (
                <p className="text-xs text-ink-7 mt-0.5">
                  Tus posts terminan con esta mención porque estás en el plan
                  gratuito. Cualquier plan de pago la elimina automáticamente.{" "}
                  <Link href="/#pricing" className="underline text-accent hover:text-accent-strong">
                    Ver planes desde €5/sem
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-success-strong mt-0.5">
                  ✓ Tus posts se publican sin marca. Incluido en tu plan.
                </p>
              )}
            </div>
            <div className="shrink-0">
              <span
                aria-label={hasWatermark ? "Marca activa" : "Sin marca"}
                className={`inline-flex items-center px-3 h-7 rounded-full border text-xs font-medium ${
                  hasWatermark
                    ? "bg-warning-soft text-warning-strong border-warning/30"
                    : "bg-success-soft text-success-strong border-success/30"
                }`}
              >
                {hasWatermark ? "Activa" : "Sin marca"}
              </span>
            </div>
          </div>
        </div>

        {/* Notificaciones email */}
        <div className="py-4 last:pb-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-9">Notificaciones por email</p>
              <p className="text-xs text-ink-7 mt-0.5">
                Avisos cuando se publica, hay un fallo o llega un cobro.
              </p>
            </div>
            <Toggle
              checked={emailNotifications}
              onChange={onEmailChange}
              ariaLabel="Notificaciones por email"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 h-5">
        {savedField ? (
          <p className="text-xs text-success-strong">✓ {savedField} guardado</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs text-error-strong">{error}</p>
        ) : null}
        {saving && !savedField && !error ? (
          <p className="text-xs text-ink-7">Guardando…</p>
        ) : null}
      </div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink-2 ${
        disabled
          ? "bg-ink-3 cursor-not-allowed opacity-50"
          : checked
            ? "bg-accent"
            : "bg-ink-4 hover:bg-ink-5"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-ink-9 rounded-full transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
