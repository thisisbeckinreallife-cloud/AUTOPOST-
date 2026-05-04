"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/brand/Button";
import { Input } from "@/components/brand/Input";
import { AuthError } from "@/components/auth/AuthError";

export function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [pwError, setPwError] = React.useState<string | undefined>();
  const [pwConfirmError, setPwConfirmError] = React.useState<string | undefined>();
  const [serverError, setServerError] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  if (!token) {
    return (
      <>
        <AuthError message="Este enlace de recuperación ya no vale o está incompleto. Pide uno nuevo." />
        <Link href="/forgot-password" className="block">
          <Button variant="primary" size="lg" fullWidth>
            Pedir un enlace nuevo
            <span aria-hidden="true">→</span>
          </Button>
        </Link>
      </>
    );
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[color:var(--np-success-soft)] text-[color:var(--np-success)] text-3xl mb-4">
          ✓
        </div>
        <h2 className="font-np-sans text-np-h3 font-semibold text-ink-9 mb-2">
          Contraseña actualizada
        </h2>
        <p className="text-np-body text-ink-7 mb-8">
          Ya puedes entrar con tu contraseña nueva.
        </p>
        <Link href="/login" className="block">
          <Button variant="primary" size="lg" fullWidth>
            Ir a iniciar sesión
            <span aria-hidden="true">→</span>
          </Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(undefined);
    setPwError(undefined);
    setPwConfirmError(undefined);

    let valid = true;
    if (password.length < 8) {
      setPwError("La contraseña necesita al menos 8 caracteres");
      valid = false;
    }
    if (password !== passwordConfirm) {
      setPwConfirmError("Las contraseñas no coinciden");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, passwordConfirm }),
      });

      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("token") || res.status === 400) {
          setServerError("Este enlace ya no vale o expiró. Pide uno nuevo desde la pantalla anterior.");
        } else {
          setServerError(data.error ?? "No pudimos actualizar la contraseña. Inténtalo en un momento.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setServerError("Sin conexión. Revisa internet y vuelve a probar.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError ? <AuthError message={serverError} /> : null}

      <Input
        label="Nueva contraseña"
        id="reset-password"
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        autoFocus
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={pwError}
        required
        minLength={8}
        trailing={
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="w-10 h-10 flex items-center justify-center text-ink-6 hover:text-ink-9 rounded-md transition-colors"
          >
            {showPw ? "🙈" : "👁"}
          </button>
        }
      />

      <Input
        label="Repítela"
        id="reset-password-confirm"
        type={showPw ? "text" : "password"}
        autoComplete="new-password"
        placeholder="Confirma la contraseña"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
        error={pwConfirmError}
        required
      />

      <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth className="mt-2">
        Guardar contraseña
        <span aria-hidden="true">→</span>
      </Button>
    </form>
  );
}
