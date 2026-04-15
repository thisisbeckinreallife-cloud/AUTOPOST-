"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Lock, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? "";

  const [form, setForm] = useState({ password: "", passwordConfirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.passwordConfirm) {
      setError("Las contrasenas no coinciden");
      return;
    }
    if (form.password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    if (!token) {
      setError("Enlace invalido. Solicita uno nuevo.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al actualizar");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-4 animate-fade-up">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-emerald/15 mx-auto mb-4">
          <CheckCircle className="h-6 w-6 text-accent-emerald" />
        </div>
        <h2 className="text-lg font-display font-bold text-white mb-2">Contrasena actualizada</h2>
        <p className="text-sm text-zinc-400 mb-6">Ya puedes iniciar sesion con tu nueva contrasena.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium"
        >
          Iniciar sesion
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-up stagger-1">
        <label className="block text-sm font-medium text-zinc-400 mb-2">Nueva contrasena</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="password"
            required
            autoFocus
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-11 pr-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 focus:bg-white/[0.05] transition-all"
            placeholder="Minimo 8 caracteres"
          />
        </div>
      </div>
      <div className="animate-fade-up stagger-2">
        <label className="block text-sm font-medium text-zinc-400 mb-2">Confirmar contrasena</label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="password"
            required
            value={form.passwordConfirm}
            onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-11 pr-4 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 focus:bg-white/[0.05] transition-all"
            placeholder="Repite tu contrasena"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}

      <div className="pt-2 animate-fade-up stagger-3">
        <Button
          type="submit"
          loading={loading}
          className="w-full h-12 text-sm font-semibold rounded-xl bg-gradient-brand-vivid hover:shadow-glow shadow-glow-sm transition-all duration-300 gap-2"
        >
          Actualizar contrasena
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="aurora w-[600px] h-[400px] bg-brand-500/[0.07] top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="aurora w-[400px] h-[300px] bg-accent-orange/[0.05] bottom-1/4 left-1/3" style={{ animationDelay: "4s" }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-10 animate-fade-up">
          <div className="relative mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-orange/10 border border-brand-500/20">
              <Zap className="h-7 w-7 text-brand-400" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-brand-500/10 animate-glow-pulse" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            Auto<span className="text-gradient">Post</span>
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-surface-card/80 backdrop-blur-xl shadow-elevated p-8 relative overflow-hidden animate-fade-up stagger-1">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] via-transparent to-accent-orange/[0.02] pointer-events-none" />
          <div className="relative">
            <div className="text-center mb-7">
              <h1 className="text-xl font-display font-bold text-white">Nueva contrasena</h1>
              <p className="text-sm text-zinc-500 mt-1">Elige una contrasena segura</p>
            </div>
            <Suspense fallback={<div className="h-48" />}>
              <ResetForm />
            </Suspense>
          </div>
        </div>

        <div className="text-center mt-6 animate-fade-in stagger-4">
          <Link
            href="/login"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Volver a iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
