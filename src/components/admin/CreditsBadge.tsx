"use client";

/**
 * Badge de créditos AI sticky en el sidebar.
 * Muestra balance + plan + botón "Comprar" cuando está bajo.
 * Auto-refresh cuando se reciben eventos custom de "credits-updated"
 * (disparados por las generaciones AI tras consumir).
 */
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface BalanceData {
  balance: {
    monthly: number;
    addon: number;
    total: number;
    resetAt: string | null;
  };
  plan: {
    tier: string;
    displayName: string;
    priceUsdMonth: number;
    monthlyAllotment: number;
    expiresAt: string | null;
  } | null;
}

export function CreditsBadge() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/credits/balance", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    // Listen to credit-updated custom events from AI components
    const handler = () => fetchBalance();
    window.addEventListener("credits-updated", handler);
    // Refresh cada 30s por seguridad
    const interval = setInterval(fetchBalance, 30_000);
    return () => {
      window.removeEventListener("credits-updated", handler);
      clearInterval(interval);
    };
  }, [fetchBalance]);

  if (loading || !data) {
    return (
      <div
        className="ap-mono"
        style={{
          padding: "10px 12px",
          background: "var(--ap-paper-2, #F8F4EA)",
          border: "1px solid var(--ap-line-2, #DCD3BF)",
          fontSize: 11,
          color: "var(--ap-ink-4, #6F6452)",
          letterSpacing: "0.1em",
        }}
      >
        Cargando…
      </div>
    );
  }

  const { balance, plan } = data;
  const allotment = plan?.monthlyAllotment ?? 0;
  const usedMonthly = allotment - balance.monthly;
  const usedPct = allotment > 0 ? Math.min(100, (usedMonthly / allotment) * 100) : 0;
  const lowOnCredits = balance.total < 10;
  const noCredits = balance.total === 0;

  return (
    <div
      className="ap-root"
      style={{
        padding: "12px 14px",
        background: "var(--ap-paper-2, #F8F4EA)",
        border: noCredits
          ? "1px solid var(--ap-stamp, #E54B26)"
          : lowOnCredits
            ? "1px solid var(--ap-mustard, #D4A627)"
            : "1px solid var(--ap-line-2, #DCD3BF)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <p
          className="ap-mono"
          style={{
            fontSize: 9,
            color: noCredits
              ? "var(--ap-stamp, #E54B26)"
              : "var(--ap-ink-4, #6F6452)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: 0,
            fontWeight: 600,
          }}
        >
          ✦ Créditos IA
        </p>
        <span
          className="ap-mono"
          style={{
            fontSize: 9,
            color: "var(--ap-ink-4, #6F6452)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {plan?.displayName ?? "—"}
        </span>
      </div>

      <p
        className="ap-display"
        style={{
          fontSize: 26,
          fontStyle: "italic",
          lineHeight: 1,
          margin: "0 0 4px",
          color: noCredits
            ? "var(--ap-stamp, #E54B26)"
            : "var(--ap-ink, #14110D)",
          letterSpacing: "-0.01em",
        }}
      >
        {balance.total}
      </p>

      <p
        className="ap-mono"
        style={{
          fontSize: 9,
          color: "var(--ap-ink-4, #6F6452)",
          letterSpacing: "0.1em",
          margin: "0 0 8px",
        }}
      >
        {balance.monthly} mes · {balance.addon} extra
      </p>

      {/* Progress bar del allotment mensual */}
      {allotment > 0 && (
        <div
          style={{
            height: 3,
            background: "var(--ap-line, #E5DFD6)",
            position: "relative",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: 3,
              width: `${usedPct}%`,
              background: "var(--ap-stamp, #E54B26)",
              transition: "width 200ms ease-out",
            }}
          />
        </div>
      )}

      {(noCredits || lowOnCredits) && (
        <Link
          href="/credits"
          className="ap-btn"
          style={{
            display: "inline-block",
            width: "100%",
            textAlign: "center",
            padding: "6px 8px",
            fontSize: 10,
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: noCredits
              ? "var(--ap-stamp, #E54B26)"
              : "transparent",
            color: noCredits
              ? "var(--ap-paper, #F1ECE2)"
              : "var(--ap-ink, #14110D)",
            border: noCredits
              ? "1px solid var(--ap-stamp, #E54B26)"
              : "1px solid var(--ap-ink, #14110D)",
            textDecoration: "none",
          }}
        >
          {noCredits ? "Sin créditos · comprar" : "Comprar más"}
        </Link>
      )}
    </div>
  );
}
