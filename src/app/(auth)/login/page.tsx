"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/editorial/atoms";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          className="ap-mono block"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--ap-ink-3)",
          }}
        >
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
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="tu@email.com"
            className="w-full pl-9 pr-3 py-3 text-sm transition-colors"
            style={{
              background: "var(--ap-paper-2)",
              border: "1px solid var(--ap-line-2)",
              color: "var(--ap-ink)",
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="ap-mono block"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--ap-ink-3)",
          }}
        >
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
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full pl-9 pr-3 py-3 text-sm transition-colors"
            style={{
              background: "var(--ap-paper-2)",
              border: "1px solid var(--ap-line-2)",
              color: "var(--ap-ink)",
              borderRadius: 4,
            }}
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
        Entrar
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Masthead */}
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
            VOL. 02 · ACCESO
          </p>
          <Logo size={20} />
        </div>

        {/* Card */}
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
              Empieza donde lo{" "}
              <span style={{ fontStyle: "italic" }}>dejaste.</span>
            </h1>
          </div>
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
          <div className="mt-5 text-center">
            <Link
              href="/forgot-password"
              className="text-xs transition-colors hover:underline"
              style={{ color: "var(--ap-ink-4)" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm" style={{ color: "var(--ap-ink-3)" }}>
            ¿Aún no tienes cuenta?{" "}
            <Link
              href="/signup"
              className="transition-colors"
              style={{
                color: "var(--ap-stamp)",
                borderBottom: "1px solid var(--ap-stamp)",
                paddingBottom: 1,
              }}
            >
              Créala gratis
            </Link>
          </p>
          <Link
            href="/"
            className="text-xs inline-block transition-opacity hover:opacity-70"
            style={{ color: "var(--ap-ink-4)" }}
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* Trust microcopy */}
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
            <span
              className="h-1 w-1"
              style={{ background: "var(--ap-olive)" }}
            />
            Sin tarjeta
          </span>
          <span style={{ color: "var(--ap-line-2)" }}>·</span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-1 w-1"
              style={{ background: "var(--ap-stamp)" }}
            />
            API oficial de Meta
          </span>
        </div>
      </div>
    </div>
  );
}
