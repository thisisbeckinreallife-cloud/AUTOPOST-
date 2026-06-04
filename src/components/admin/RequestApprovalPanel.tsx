"use client";

/**
 * Panel embebido en el detalle de un post para solicitar aprobación al cliente.
 * - Modal inline con email + horas de expiración + (opcional) mensaje.
 * - Llama a /api/posts/[postId]/request-approval.
 * - Muestra historial de solicitudes recientes con badges de estado.
 */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

interface ApprovalEntry {
  id: string;
  email: string;
  expiresAt: string;
  respondedAt: string | null;
  decision: "APPROVED" | "REJECTED" | null;
  feedback: string | null;
  createdAt: string;
}

interface Props {
  postId: string;
  approvalStatus: string;
  rejectionReason: string | null;
  /**
   * Lista de approval requests existentes. Se inicializa desde el server.
   * Si llega vacío, el panel hace un GET al detalle del post para refrescar.
   */
  initialRequests?: ApprovalEntry[];
}

export function RequestApprovalPanel({
  postId,
  approvalStatus,
  rejectionReason,
  initialRequests = [],
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [hours, setHours] = useState(72);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<ApprovalEntry[]>(initialRequests);

  // Si el server no incluyó la lista, cargamos desde la API.
  useEffect(() => {
    if (initialRequests.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/approval-requests`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.data)) setRequests(data.data);
      } catch {
        // Ignoramos — el panel sigue funcional sin historial.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, initialRequests.length]);

  async function submit() {
    if (!email.includes("@")) {
      setError("Email inválido");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/request-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          expiresHours: hours,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar la solicitud");
        toast(data.error ?? "Error al enviar", "error");
        return;
      }
      toast(
        data.emailSent
          ? "Email enviado al cliente"
          : "Solicitud creada (email no configurado, copia el enlace)",
        data.emailSent ? "success" : "info",
      );
      // Reset form + cerrar modal + recargar lista.
      setOpen(false);
      setEmail("");
      setMessage("");
      const fresh = await fetch(`/api/posts/${postId}/approval-requests`).catch(
        () => null,
      );
      if (fresh && fresh.ok) {
        const d = await fresh.json();
        if (Array.isArray(d.data)) setRequests(d.data);
      }
    } catch {
      setError("Error de red");
      toast("Error de red", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCount = requests.filter(
    (r) => !r.respondedAt && new Date(r.expiresAt) > new Date(),
  ).length;

  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line-2)",
        padding: "clamp(20px, 3vw, 32px)",
      }}
      aria-label="Aprobación del cliente"
    >
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            className="ap-mono"
            style={{
              fontSize: 11,
              color: "var(--ap-stamp)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ✦ Aprobación del cliente
          </p>
          <h3
            className="ap-display"
            style={{
              fontSize: "clamp(22px, 3vw, 28px)",
              fontStyle: "normal",
              lineHeight: 1,
              color: "var(--ap-ink)",
              margin: "6px 0 0",
              letterSpacing: "-0.01em",
            }}
          >
            Solicitar firma vía email
          </h3>
          <p
            style={{
              fontSize: 13,
              color: "var(--ap-ink-3)",
              margin: "8px 0 0",
              fontStyle: "normal",
            }}
          >
            Tu cliente revisa y aprueba sin necesidad de iniciar sesión.
          </p>
        </div>

        <ApprovalStatusBadge
          status={approvalStatus}
          pendingCount={pendingCount}
        />
      </header>

      {rejectionReason && approvalStatus === "REJECTED" && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--ap-paper)",
            borderLeft: "2px solid var(--ap-stamp)",
            margin: "0 0 18px",
          }}
        >
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            Motivo del rechazo
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink-2)" }}>
            «{rejectionReason}»
          </p>
        </div>
      )}

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ap-btn ap-btn--stamp"
          style={{ padding: "12px 20px", fontSize: 13 }}
        >
          Pedir aprobación al cliente
        </button>
      )}

      {open && (
        <div style={{ display: "grid", gap: 12 }}>
          <FieldLabel htmlFor="approval-email">Email del cliente</FieldLabel>
          <input
            id="approval-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
            disabled={submitting}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ap-ink)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--ap-line-2)")}
          />

          <FieldLabel htmlFor="approval-hours">
            Expira en (horas)
          </FieldLabel>
          <select
            id="approval-hours"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            disabled={submitting}
            style={{
              ...inputStyle,
              cursor: submitting ? "not-allowed" : "pointer",
              maxWidth: 200,
            }}
          >
            <option value={24}>24 horas</option>
            <option value={48}>48 horas</option>
            <option value={72}>72 horas (recomendado)</option>
            <option value={168}>1 semana</option>
          </select>

          <FieldLabel htmlFor="approval-message">
            Nota opcional (no se envía al cliente, sólo para tu referencia)
          </FieldLabel>
          <textarea
            id="approval-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={500}
            disabled={submitting}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Cliente prefiere revisión antes del lunes…"
          />

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="ap-btn ap-btn--stamp"
              style={{
                padding: "12px 20px",
                fontSize: 13,
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? "Enviando…" : "Enviar enlace"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              className="ap-btn ap-btn--ghost"
              style={{ padding: "12px 20px", fontSize: 13 }}
            >
              Cancelar
            </button>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                margin: 0,
                padding: "8px 12px",
                background: "var(--ap-paper)",
                borderLeft: "2px solid var(--ap-stamp)",
                fontSize: 13,
                color: "var(--ap-ink-2)",
              }}
            >
              {error}
            </p>
          )}
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <hr className="ap-rule" style={{ marginBottom: 14, opacity: 0.5 }} />
          <p
            className="ap-mono"
            style={{
              fontSize: 11,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            Historial · {requests.length}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {requests.slice(0, 5).map((r) => (
              <li
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderTop: "1px solid var(--ap-line)",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: "var(--ap-ink-2)",
                      fontFamily: "var(--ap-font-mono)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.email}
                  </p>
                  <p
                    className="ap-mono"
                    style={{
                      margin: "2px 0 0",
                      fontSize: 10,
                      color: "var(--ap-ink-4)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {new Date(r.createdAt).toLocaleString("es-ES", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <RequestStatusPill request={r} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ApprovalStatusBadge({
  status,
  pendingCount,
}: {
  status: string;
  pendingCount: number;
}) {
  const map: Record<
    string,
    { label: string; bg: string; fg: string; border: string }
  > = {
    APPROVED: {
      label: "Aprobado",
      bg: "var(--ap-paper)",
      fg: "var(--ap-olive)",
      border: "var(--ap-olive)",
    },
    REJECTED: {
      label: "Rechazado",
      bg: "var(--ap-paper)",
      fg: "var(--ap-stamp)",
      border: "var(--ap-stamp)",
    },
    PENDING_APPROVAL: {
      label: pendingCount > 0 ? `Pendiente · ${pendingCount}` : "Pendiente",
      bg: "var(--ap-paper)",
      fg: "var(--ap-ink-2)",
      border: "var(--ap-line-2)",
    },
  };
  const cfg = map[status] ?? {
    label: "Sin solicitud",
    bg: "transparent",
    fg: "var(--ap-ink-4)",
    border: "var(--ap-line)",
  };
  return (
    <span
      className="ap-mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        background: cfg.bg,
        color: cfg.fg,
        border: `1px solid ${cfg.border}`,
        padding: "5px 10px",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function RequestStatusPill({ request }: { request: ApprovalEntry }) {
  const expired = new Date(request.expiresAt) < new Date();
  let label = "Pendiente";
  let color = "var(--ap-ink-3)";
  if (request.respondedAt) {
    label = request.decision === "APPROVED" ? "Aprobado" : "Rechazado";
    color = request.decision === "APPROVED" ? "var(--ap-olive)" : "var(--ap-stamp)";
  } else if (expired) {
    label = "Expirado";
    color = "var(--ap-ink-4)";
  }
  return (
    <span
      className="ap-mono"
      style={{
        fontSize: 10,
        color,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--ap-paper)",
  border: "1px solid var(--ap-line-2)",
  padding: "10px 12px",
  fontSize: 14,
  fontFamily: "inherit",
  color: "var(--ap-ink)",
  lineHeight: 1.55,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="ap-mono"
      style={{
        fontSize: 10,
        color: "var(--ap-ink-4)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </label>
  );
}
