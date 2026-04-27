"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/editorial/atoms";

function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", passwordConfirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear la cuenta");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--ap-paper-2)",
    border: "1px solid var(--ap-line-2)",
    color: "var(--ap-ink)",
    borderRadius: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: "0.14em",
    color: "var(--ap-ink-3)",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="ap-mono block mb-2" style={labelStyle}>
          EMAIL
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--ap-ink-4)" }}
          />
          <input
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full pl-9 pr-3 py-3 text-sm focus:outline-none"
            style={inputStyle}
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div>
        <label className="ap-mono block mb-2" style={labelStyle}>
          CONTRASEÑA
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--ap-ink-4)" }}
          />
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full pl-9 pr-3 py-3 text-sm focus:outline-none"
            style={inputStyle}
            placeholder="Mínimo 8 caracteres"
          />
        </div>
      </div>

      <div>
        <label className="ap-mono block mb-2" style={labelStyle}>
          REPITE LA CONTRASEÑA
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--ap-ink-4)" }}
          />
          <input
            type="password"
            required
            value={form.passwordConfirm}
            onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
            className="w-full pl-9 pr-3 py-3 text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-md p-3 text-xs"
          style={{
            background: "rgba(229,75,38,0.06)",
            border: "1px solid rgba(229,75,38,0.30)",
            color: "var(--ap-stamp)",
          }}
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        className="w-full h-12 text-sm font-semibold gap-2 transition-all"
        style={{
          background: "var(--ap-stamp)",
          color: "var(--ap-paper)",
          borderRadius: 4,
          border: "1.5px solid var(--ap-stamp)",
        }}
      >
        Crear mi cuenta
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--ap-ink-4)",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            VOL. 02 · NUEVA SUSCRIPCIÓN
          </p>
          <Logo size={20} />
        </div>

        <div
          className="p-8"
          style={{
            background: "var(--ap-paper-2)",
            border: "1px solid var(--ap-line-2)",
            borderRadius: 4,
          }}
        >
          <div className="text-center mb-7">
            <h1
              className="ap-display"
              style={{
                fontSize: 30,
                color: "var(--ap-ink)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Crea tu primera{" "}
              <span style={{ fontStyle: "italic" }}>carpeta.</span>
            </h1>
          </div>
          <Suspense fallback={<div className="h-64" />}>
            <SignupForm />
          </Suspense>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: "var(--ap-ink-3)" }}>
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="transition-colors"
              style={{
                color: "var(--ap-stamp)",
                borderBottom: "1px solid var(--ap-stamp)",
                paddingBottom: 1,
              }}
            >
              Entrar
            </Link>
          </p>
        </div>

        <div
          className="ap-mono flex items-center justify-center gap-4 mt-7"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1" style={{ background: "var(--ap-olive)" }} />
            Sin tarjeta
          </span>
          <span style={{ color: "var(--ap-line-2)" }}>·</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1" style={{ background: "var(--ap-stamp)" }} />
            API oficial de Meta
          </span>
          <span style={{ color: "var(--ap-line-2)" }}>·</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1 w-1" style={{ background: "var(--ap-mustard)" }} />
            AES-256
          </span>
        </div>
      </div>
    </div>
  );
}
