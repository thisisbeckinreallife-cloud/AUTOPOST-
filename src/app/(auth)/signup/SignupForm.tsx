"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/brand/Button";
import { Input } from "@/components/brand/Input";
import { AuthError } from "@/components/auth/AuthError";

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function SignupForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [pwError, setPwError] = React.useState<string | undefined>();
  const [pwConfirmError, setPwConfirmError] = React.useState<string | undefined>();
  const [serverError, setServerError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);

  const [showPw, setShowPw] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    setEmailError(undefined);
    setPwError(undefined);
    setPwConfirmError(undefined);

    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError("Introduce un email válido");
      valid = false;
    }
    if (password.length < 8) {
      setPwError("La contraseña necesita al menos 8 caracteres");
      valid = false;
    }
    if (password !== passwordConfirm) {
      setPwConfirmError("Las contraseñas no coinciden");
      valid = false;
    }
    if (!acceptedTerms) {
      setServerError("Para crear la cuenta tienes que aceptar los términos.");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          passwordConfirm,
        }),
        credentials: "same-origin",
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* respuesta no-JSON */
      }

      if (!res.ok) {
        if (res.status === 429) {
          setServerError("Demasiados intentos. Espera unos minutos antes de probar otra vez.");
        } else if (data.error === "Email already in use") {
          setEmailError("Ya hay una cuenta con este email. Entra desde la pantalla de login.");
        } else {
          setServerError(data.error ?? "No pudimos crear tu cuenta. Inténtalo en un momento.");
        }
        setLoading(false);
        return;
      }

      // Hard navigation tras success
      window.location.assign("/dashboard");
    } catch {
      setServerError("Sin conexión. Revisa internet y vuelve a probar.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError ? <AuthError message={serverError} /> : null}

      <Input
        label="Email"
        id="signup-email"
        type="email"
        autoComplete="email"
        autoFocus
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        required
      />

      <Input
        label="Contraseña"
        id="signup-password"
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={pwError}
        hint={!pwError && password.length === 0 ? "Mínimo 8 caracteres" : undefined}
        required
        minLength={8}
        trailing={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPw}
            className="w-10 h-10 flex items-center justify-center text-ink-6 hover:text-ink-9 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          >
            {showPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        }
      />

      <Input
        label="Confirma tu contraseña"
        id="signup-password-confirm"
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Repite la contraseña"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        error={pwConfirmError}
        required
      />

      <label
        htmlFor="signup-terms"
        className="flex items-start gap-3 mt-2 text-np-caption text-ink-7 cursor-pointer"
      >
        <input
          id="signup-terms"
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          aria-describedby={serverError?.includes("términos") ? "signup-terms-error" : undefined}
          className="mt-0.5 w-4 h-4 accent-[color:var(--accent)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring rounded-sm"
        />
        <span>
          Acepto los{" "}
          <a href="/legal/terms" target="_blank" className="text-ink-9 underline hover:text-accent">
            términos
          </a>{" "}
          y la{" "}
          <a href="/legal/privacy" target="_blank" className="text-ink-9 underline hover:text-accent">
            política de privacidad
          </a>
          .
        </span>
      </label>
      {serverError?.includes("términos") ? (
        <p id="signup-terms-error" role="alert" className="text-xs text-error-strong -mt-2">
          {serverError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        fullWidth
        className="mt-2"
      >
        Crear cuenta
        <span aria-hidden="true">→</span>
      </Button>
    </form>
  );
}
