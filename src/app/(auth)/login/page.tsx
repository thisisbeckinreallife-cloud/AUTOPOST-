"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Lock, Mail, ArrowRight } from "lucide-react";

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
      <div className="animate-stagger-in delay-2">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Email
        </label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="email"
            required
            autoFocus
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-700/50 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 focus:bg-white/[0.05] transition-all duration-300"
            placeholder="admin@example.com"
          />
        </div>
      </div>
      <div className="animate-stagger-in delay-3">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-700/50 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 focus:bg-white/[0.05] transition-all duration-300"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-bounce-in">
          {error}
        </div>
      )}

      <div className="animate-stagger-in delay-4 pt-1">
        <Button
          type="submit"
          loading={loading}
          className="w-full h-12 text-sm font-bold rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 hover:shadow-glow-lg hover:scale-[1.02] transition-all duration-300 gap-2"
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
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] bg-gradient-radial from-brand-500/8 to-transparent rounded-full animate-gradient-shift" />
        <div className="absolute -bottom-1/3 -right-1/4 w-[500px] h-[500px] bg-gradient-radial from-brand-600/6 to-transparent rounded-full animate-gradient-shift" style={{ animationDelay: "-4s" }} />
        <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-gradient-radial from-blue-500/4 to-transparent rounded-full animate-float" />
      </div>

      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dots opacity-50" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo with dramatic animation */}
        <div className="flex flex-col items-center mb-10 animate-stagger-in delay-0">
          <div className="relative mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/20 border border-brand-500/20 animate-float">
              <Zap className="h-8 w-8 text-brand-400" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-brand-500/10 blur-lg -z-10 animate-pulse-glow" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white">
            Auto<span className="text-gradient-shimmer">Post</span>
          </span>
          <p className="text-xs text-slate-600 mt-1 tracking-widest uppercase">Instagram Scheduler</p>
        </div>

        {/* Card with glass effect */}
        <div className="rounded-2xl glass-strong shadow-dark-lg p-8 animate-card-appear glow-border">
          <div className="text-center mb-7 animate-stagger-in delay-1">
            <h1 className="text-xl font-bold text-slate-100">Bienvenido</h1>
            <p className="text-sm text-slate-500 mt-1">Inicia sesion para continuar</p>
          </div>
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-700 mt-8 tracking-wider uppercase animate-stagger-in delay-5">
          Powered by AutoPost
        </p>
      </div>
    </div>
  );
}
