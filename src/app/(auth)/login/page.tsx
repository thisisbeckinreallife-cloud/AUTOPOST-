"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Lock, Mail, ArrowRight } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="animate-fade-in">
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Email
        </label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 focus:bg-white/[0.04] transition-all"
            placeholder="admin@example.com"
          />
        </div>
      </div>
      <div className="animate-fade-in">
        <label className="block text-sm font-medium text-zinc-400 mb-2">
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 focus:bg-white/[0.04] transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-3 text-sm text-red-400 animate-fade-in">
          {error}
        </div>
      )}

      <div className="pt-1">
        <Button
          type="submit"
          loading={loading}
          className="w-full h-12 text-sm font-semibold rounded-xl bg-brand-500 hover:bg-brand-400 shadow-glow-sm hover:shadow-glow transition-all gap-2"
        >
          Iniciar sesion
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-radial from-brand-500/[0.06] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/15">
              <Zap className="h-7 w-7 text-brand-400" />
            </div>
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            Auto<span className="text-gradient">Post</span>
          </span>
          <p className="text-xs text-zinc-600 mt-1.5 tracking-widest uppercase">
            Instagram Scheduler
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-white/[0.06] bg-surface-card shadow-elevated p-8">
          <div className="text-center mb-7">
            <h1 className="text-xl font-display font-bold text-white">Bienvenido</h1>
            <p className="text-sm text-zinc-500 mt-1">Inicia sesion para continuar</p>
          </div>
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            ← Volver a AutoPost
          </Link>
        </div>
      </div>
    </div>
  );
}
