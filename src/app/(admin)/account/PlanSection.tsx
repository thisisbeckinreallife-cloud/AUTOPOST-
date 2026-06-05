"use client";

import { useState } from "react";
import Link from "next/link";

interface PlanData {
  tier: "FREE" | "BASIC" | "PRO" | "AGENCY";
  label: string;
  priceWeekly: number;
  features: {
    hasWatermark: boolean;
    maxAccounts: number;
    postsPerMonth: number;
    teamSize: number;
    prioritySupport: boolean;
  };
  subscription: {
    status: string;
    tier: string | null;
    period: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEnd: string | null;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: "Prueba gratuita activa", color: "bg-accent-soft text-accent-strong border-accent/30" },
  active: { label: "Activa", color: "bg-success-soft text-success-strong border-success/30" },
  past_due: { label: "Pago pendiente", color: "bg-warning-soft text-warning-strong border-warning/30" },
  canceled: { label: "Cancelada", color: "bg-ink-3 text-ink-7 border-ink-4" },
  incomplete: { label: "Incompleta", color: "bg-warning-soft text-warning-strong border-warning/30" },
  unpaid: { label: "Sin pagar", color: "bg-error-soft text-error-strong border-error/30" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function PlanSection({ plan }: { plan: PlanData }) {
  const [openingPortal, setOpeningPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sub = plan.subscription;
  const status = sub?.status ?? "free";
  const statusBadge = STATUS_LABELS[status] ?? { label: status, color: "bg-ink-3 text-ink-7 border-ink-4" };
  const trialDaysLeft = sub?.trialEnd ? daysUntil(sub.trialEnd) : null;

  async function openPortal() {
    setOpeningPortal(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo abrir el portal");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setOpeningPortal(false);
    }
  }

  return (
    <section aria-labelledby="plan-heading" className="bg-ink-2 border border-ink-4 rounded-md p-8">
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 id="plan-heading" className="text-xl font-semibold text-ink-9 tracking-tight mb-1">
            Plan y facturación
          </h2>
          <p className="text-sm text-ink-7">Tu plan actual y próximos cobros.</p>
        </div>
        <span className={`inline-flex items-center px-3 h-7 rounded-full border text-xs font-medium ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
      </header>

      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="font-mono text-xs text-ink-6 uppercase tracking-wider mb-2">
            Plan actual
          </p>
          <p className="text-2xl font-semibold text-ink-9 tracking-tight">{plan.label}</p>
          {plan.priceWeekly > 0 ? (
            <p className="text-sm text-ink-7 mt-1">
              {plan.priceWeekly}€/sem
              {sub?.period === "yearly" ? " · facturación anual (-20%)" : ""}
            </p>
          ) : (
            <p className="text-sm text-ink-7 mt-1">Sin coste</p>
          )}
        </div>

        <div>
          <p className="font-mono text-xs text-ink-6 uppercase tracking-wider mb-2">
            {sub?.cancelAtPeriodEnd ? "Acceso hasta" : status === "trialing" ? "Trial termina" : "Próximo cobro"}
          </p>
          <p className="text-2xl font-semibold text-ink-9 tracking-tight">
            {formatDate(status === "trialing" ? sub?.trialEnd ?? null : sub?.currentPeriodEnd ?? null)}
          </p>
          {trialDaysLeft !== null && trialDaysLeft > 0 ? (
            <p className="text-sm text-ink-7 mt-1">
              {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"} restantes · sin cobro hasta el día 7
            </p>
          ) : null}
          {sub?.cancelAtPeriodEnd ? (
            <p className="text-sm text-warning-strong mt-1">Cancelación programada</p>
          ) : null}
        </div>
      </div>

      <div className="bg-ink-1 border border-ink-3 rounded-md p-5 mb-6">
        <p className="font-mono text-xs text-ink-6 uppercase tracking-wider mb-3">
          Lo que incluye
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm text-ink-8">
          <li>{plan.features.maxAccounts} {plan.features.maxAccounts === 1 ? "cuenta" : "cuentas"} conectadas</li>
          <li>
            {plan.features.postsPerMonth === Infinity
              ? "Posts ilimitados"
              : `${plan.features.postsPerMonth} posts/mes`}
          </li>
          <li>
            {plan.features.hasWatermark
              ? "Posts con marca \"autopost.app\""
              : "Posts sin marca de agua"}
          </li>
          <li>
            {plan.features.teamSize > 1
              ? `Equipo de ${plan.features.teamSize} personas`
              : "Un usuario"}
          </li>
          <li>{plan.features.prioritySupport ? "Soporte prioritario" : "Soporte por email"}</li>
        </ul>
      </div>

      <div className="flex gap-2 flex-wrap">
        {sub ? (
          <button
            type="button"
            onClick={openPortal}
            disabled={openingPortal}
            className="inline-flex items-center justify-center h-11 px-4 rounded-md bg-primary text-primary-fg font-medium text-sm shadow-md hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {openingPortal ? "Abriendo…" : "Gestionar plan en Stripe"}
          </button>
        ) : (
          <Link
            href="/#pricing"
            className="inline-flex items-center justify-center h-11 px-4 rounded-md bg-primary text-primary-fg font-medium text-sm shadow-md hover:bg-primary-hover transition-all"
          >
            Ver planes y empezar 7 días gratis
          </Link>
        )}
        <Link
          href="/#pricing"
          className="inline-flex items-center justify-center h-11 px-4 rounded-md border border-ink-4 text-ink-9 font-medium text-sm hover:bg-ink-3 hover:border-ink-5 transition-all"
        >
          Comparar planes
        </Link>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-error-strong">
          {error}
        </p>
      ) : null}
    </section>
  );
}
