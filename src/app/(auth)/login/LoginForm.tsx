"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/brand/Button";
import { Input } from "@/components/brand/Input";
import { AuthError } from "@/components/auth/AuthError";

interface LoginFormProps {
  showGoogle: boolean;
  /** Slot para el bloque OAuth + divider (renderizado server-side) */
  children?: React.ReactNode;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function LoginForm({ children }: LoginFormProps) {
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? "/dashboard";
  const queryError = searchParams?.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [pwError, setPwError] = React.useState<string | undefined>();
  const [serverError, setServerError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  // Mensaje del error de Google OAuth (si llega del callback)
  const oauthError = !serverError && queryError ? queryError : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    setEmailError(undefined);
    setPwError(undefined);

    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError("Introduce un email válido");
      valid = false;
    }
    if (password.length < 1) {
      setPwError("Escribe tu contraseña");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        credentials: "same-origin",
      });

      if (!res.ok) {
        if (res.status === 401) {
          setServerError("Email o contraseña incorrectos.");
        } else if (res.status === 429) {
          setServerError("Demasiados intentos. Espera unos minutos antes de probar otra vez.");
        } else {
          setServerError("No pudimos iniciarte sesión. Inténtalo en un momento.");
        }
        setLoading(false);
        return;
      }

      // Hard navigation — más fiable que router.push para flujos auth
      window.location.assign(from);
    } catch {
      setServerError("Sin conexión. Revisa internet y vuelve a probar.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {children}

      <AuthError code={oauthError} />
      {serverError ? <AuthError message={serverError} /> : null}

      <Input
        label="Email"
        id="login-email"
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
        id="login-password"
        type={showPw ? "text" : "password"}
        autoComplete="current-password"
        placeholder="••••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={pwError}
        required
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

      <div className="flex justify-end -mt-2">
        <Link
          href="/forgot-password"
          className="text-np-caption text-ink-7 hover:text-pri transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth className="mt-2">
        Entrar
        <span aria-hidden="true">→</span>
      </Button>
    </form>
  );
}
