"use client";

/**
 * Card de plataforma social con OAuth 2-clicks.
 *
 * Estados visuales:
 *   - Connected (verde) — username + botón "Desconectar"
 *   - Available (default) — botón "Conectar" (redirect OAuth)
 *   - Token expired (amarillo) — "Reconectar"
 *   - Error (rojo) — muestra error + "Reintentar"
 *   - Coming soon (gris dashed) — env vars no configuradas
 */
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { PlatformConfig } from "@/lib/social/platforms";

interface ConnectionInfo {
  username: string | null;
  displayName: string | null;
  status: string;
  expiresAt: string | null;
  lastError: string | null;
}

interface Props {
  businessId: string;
  config: PlatformConfig;
  connection: ConnectionInfo | null;
}

export function SocialPlatformCard({ businessId, config, connection }: Props) {
  const { toast } = useToast();
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = connection?.status === "ACTIVE";
  const tokenExpired = connection?.status === "TOKEN_EXPIRED";
  const hasError = connection?.status === "ERROR";
  const comingSoon = !config.available;

  const tokenExpiringSoon =
    connection?.expiresAt &&
    new Date(connection.expiresAt).getTime() < Date.now() + 7 * 24 * 3600 * 1000;

  async function disconnect() {
    if (!confirm(`¿Desconectar ${config.displayName}?`)) return;
    setDisconnecting(true);
    try {
      const res = await fetch(
        `/api/social/${config.platform.toLowerCase()}/disconnect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Error al desconectar", "error");
        return;
      }
      toast(`${config.displayName} desconectado`, "info");
      // Reload para mostrar estado actualizado
      window.location.reload();
    } catch {
      toast("Error de red", "error");
    } finally {
      setDisconnecting(false);
    }
  }

  const startOAuthHref = `/api/social/${config.platform.toLowerCase()}/oauth/start?businessId=${businessId}`;

  return (
    <div
      style={{
        background: "var(--ap-paper-2)",
        border: isConnected
          ? "1px solid #6B7A2E"
          : tokenExpired
            ? "1px solid #D4A627"
            : hasError
              ? "1px solid var(--ap-stamp)"
              : comingSoon
                ? "1px dashed var(--ap-line-2)"
                : "1px solid var(--ap-line-2)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: "var(--ap-paper)",
          border: "1px solid var(--ap-line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "var(--ap-ink)",
          fontFamily: "var(--ap-font-mono)",
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {config.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink)", fontWeight: 600 }}>
          {config.displayName}
        </p>
        <p
          className="ap-mono"
          style={{
            margin: "2px 0 0",
            fontSize: 10,
            color: isConnected
              ? "#6B7A2E"
              : tokenExpired
                ? "#D4A627"
                : hasError
                  ? "var(--ap-stamp)"
                  : "var(--ap-ink-3)",
            letterSpacing: "0.1em",
          }}
        >
          {isConnected
            ? `${connection?.displayName ?? connection?.username ?? "Conectado"}${tokenExpiringSoon ? " · token expira pronto" : ""}`
            : tokenExpired
              ? "Token expirado · reconecta"
              : hasError
                ? `Error: ${connection?.lastError?.slice(0, 60) ?? "desconocido"}`
                : comingSoon
                  ? config.unavailableReason ?? "Próximamente"
                  : "No conectado"}
        </p>
      </div>

      {isConnected ? (
        <button
          type="button"
          onClick={disconnect}
          disabled={disconnecting}
          className="ap-mono"
          style={{
            background: "transparent",
            border: "1px solid var(--ap-line-2)",
            color: "var(--ap-ink-3)",
            padding: "6px 12px",
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: disconnecting ? "wait" : "pointer",
            opacity: disconnecting ? 0.5 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {disconnecting ? "..." : "Desconectar"}
        </button>
      ) : comingSoon ? (
        <span
          className="ap-mono"
          style={{
            fontSize: 9,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Próx.
        </span>
      ) : (
        <a
          href={startOAuthHref}
          className="ap-btn ap-btn--stamp"
          style={{
            padding: "8px 12px",
            fontSize: 10,
            fontFamily: "var(--ap-font-mono)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {tokenExpired || hasError ? "Reconectar" : "Conectar"}
        </a>
      )}
    </div>
  );
}
