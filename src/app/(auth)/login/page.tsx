"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

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
        credentials: "same-origin",
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        /* respuesta no-JSON */
      }

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}: no se pudo iniciar sesión`);
        setLoading(false);
        return;
      }

      // Hard navigation — más fiable que router.push para flujos auth
      window.location.assign(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "#48484A", letterSpacing: "0.05em" }}>
          EMAIL
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#86868B" }} />
          <input
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm transition-all focus:outline-none"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(29,29,31,0.10)",
              color: "#1D1D1F",
            }}
            placeholder="tu@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "#48484A", letterSpacing: "0.05em" }}>
          CONTRASEÑA
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#86868B" }} />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm transition-all focus:outline-none"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(29,29,31,0.10)",
              color: "#1D1D1F",
            }}
          />
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.20)",
            color: "#DC2626",
          }}
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        className="w-full h-12 text-sm font-semibold rounded-full gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
        style={{
          background: "#1D1D1F",
          color: "#F5F5F7",
          boxShadow: "0 8px 24px -8px rgba(29,29,31,0.50), 0 0 0 1px #1D1D1F, 0 0 32px -10px rgba(168,218,220,0.35)",
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#F5F5F7" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo minimal */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #A8DADC 0%, #7DBCBE 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 20px -6px rgba(125,188,190,0.35)",
            }}
            aria-hidden="true"
          >
            <span
              className="font-black text-xl leading-none"
              style={{ color: "#1D1D1F", fontFamily: "Satoshi, Inter, system-ui, sans-serif", letterSpacing: "-0.04em" }}
            >
              A
            </span>
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: "#1D1D1F", letterSpacing: "-0.01em", fontFamily: "Satoshi, Inter, system-ui, sans-serif" }}
          >
            Aluminum Studio
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(29,29,31,0.06)",
            boxShadow: "0 24px 48px -16px rgba(29,29,31,0.10), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="text-center mb-6">
            <h1
              className="text-2xl font-bold"
              style={{ color: "#1D1D1F", fontFamily: "Satoshi, Inter, system-ui, sans-serif", letterSpacing: "-0.02em" }}
            >
              Empieza donde lo dejaste.
            </h1>
          </div>
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-xs transition-colors hover:underline"
              style={{ color: "#86868B" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="text-center mt-5 space-y-1.5">
          <p className="text-sm" style={{ color: "#48484A" }}>
            ¿Aún no tienes cuenta?{" "}
            <Link href="/signup" className="font-semibold transition-colors hover:underline" style={{ color: "#7DBCBE" }}>
              Créala gratis
            </Link>
          </p>
          <Link
            href="/"
            className="text-xs inline-block transition-colors hover:underline"
            style={{ color: "#86868B" }}
          >
            ← Volver a Aluminum Studio
          </Link>
        </div>

        {/* Trust microcopy */}
        <div className="flex items-center justify-center gap-3 mt-6 text-[10px]" style={{ color: "#86868B" }}>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full" style={{ background: "#16A34A" }} />
            Sin tarjeta
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full" style={{ background: "#7DBCBE" }} />
            API oficial de Meta
          </span>
        </div>
      </div>
    </div>
  );
}
