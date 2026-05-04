"use client";

import * as React from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError } from "@/components/auth/AuthError";
import { Button } from "@/components/brand/Button";
import { Input } from "@/components/brand/Input";

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * /forgot-password — Fase 2 plan funcional.
 *
 * Backend: POST /api/auth/forgot-password { email } — siempre 200 (anti-enum).
 * El email con el link de reset se envía si la cuenta existe.
 *
 * UI brand: card sencilla con un solo input y CTA. Estado "enviado" claro
 * con mensaje "Te hemos mandado un email a X. Revisa tu bandeja."
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [serverError, setServerError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    setEmailError(undefined);

    if (!isValidEmail(email)) {
      setEmailError("Introduce un email válido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setServerError("Demasiados intentos. Espera unos minutos antes de probar otra vez.");
        } else {
          setServerError("No pudimos enviar el email. Inténtalo en un momento.");
        }
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setServerError("Sin conexión. Revisa internet y vuelve a probar.");
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout page="forgot" backHref="/login" backLabel="← Volver al login">
        <h1 className="font-np-sans text-np-h2 font-semibold text-ink-9 mb-2">
          Revisa tu email
        </h1>
        <p className="text-np-body text-ink-7 mb-8">
          Si tienes cuenta, te hemos mandado un email a{" "}
          <strong className="text-ink-9 font-mono">{email}</strong> con un link
          para crear una contraseña nueva. El link vale durante 1 hora.
        </p>

        <div className="px-4 py-3 rounded-lg bg-pri-soft border border-pri/40 text-np-caption text-pri mb-6 flex items-start gap-2">
          <span aria-hidden="true">ℹ</span>
          <span>
            ¿No te llega? Mira la carpeta de spam o reenvía el email desde aquí
            cambiando la dirección.
          </span>
        </div>

        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
        >
          Cambiar email
        </Button>

        <p className="mt-6 text-center text-np-body text-ink-7">
          ¿Te acordaste?{" "}
          <Link
            href="/login"
            className="text-ink-9 font-medium border-b border-ink-4 hover:text-pri hover:border-pri transition-colors"
          >
            Vuelve a entrar
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout page="forgot" backHref="/login" backLabel="← Volver al login">
      <h1 className="font-np-sans text-np-h2 font-semibold text-ink-9 mb-2">
        Recupera tu cuenta
      </h1>
      <p className="text-np-body text-ink-7 mb-8">
        Te mandamos un email con un link para crear una contraseña nueva.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {serverError ? <AuthError message={serverError} /> : null}

        <Input
          label="Email"
          id="forgot-email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          required
        />

        <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth className="mt-2">
          Enviar email de recuperación
          <span aria-hidden="true">→</span>
        </Button>
      </form>
    </AuthLayout>
  );
}
