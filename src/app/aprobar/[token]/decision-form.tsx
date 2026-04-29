"use client";

/**
 * Formulario cliente para enviar la decisión del cliente al endpoint público
 * /api/approval/[token]/respond. Sin auth.
 *
 * Estados:
 *   - idle: dos botones (Aprobar / Rechazar). Click en Rechazar revela
 *           textarea para feedback opcional.
 *   - submitting: botones deshabilitados con texto cambiado.
 *   - success: muestra confirmación grande tras éxito.
 *   - error: muestra error inline (rate-limit del navegador, red caída...).
 */
import { useState } from "react";

export function ApprovalDecisionForm({ token }: { token: string }) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function submit(d: "APPROVED" | "REJECTED") {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/approval/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: d,
          feedback: d === "REJECTED" ? feedback.trim() || undefined : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar la decisión");
        setSubmitting(false);
        return;
      }
      setSuccess(d);
    } catch {
      setError("Error de red. Reintenta en unos segundos.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: "clamp(28px, 5vw, 48px)",
          background:
            success === "APPROVED" ? "var(--ap-paper-2)" : "var(--ap-paper-2)",
          borderLeft: `3px solid ${success === "APPROVED" ? "#6B7A2E" : "var(--ap-stamp)"}`,
          textAlign: "center",
        }}
      >
        <p
          className="ap-mono"
          style={{
            fontSize: 11,
            color:
              success === "APPROVED" ? "#6B7A2E" : "var(--ap-stamp)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          ✓ Recibido
        </p>
        <h2
          className="ap-display"
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontStyle: "italic",
            margin: "0 0 12px",
            color: "var(--ap-ink)",
          }}
        >
          {success === "APPROVED"
            ? "Edición aprobada."
            : "Edición rechazada."}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "var(--ap-ink-3)",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          {success === "APPROVED"
            ? "La edición se publicará a la hora prevista."
            : "Tu agencia recibirá tu nota y propondrá una nueva edición."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        className="ap-mono"
        style={{
          fontSize: 11,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          margin: "0 0 14px",
        }}
      >
        ¿Damos por buena esta edición?
      </p>

      {decision === "REJECTED" && (
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="feedback"
            className="ap-mono"
            style={{
              display: "block",
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Cuenta a tu agencia qué cambiarías (opcional)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Cambiaría el cierre, la imagen 3 está borrosa..."
            style={{
              width: "100%",
              background: "var(--ap-paper-2)",
              border: "1px solid var(--ap-line-2)",
              padding: "12px 14px",
              fontSize: 14,
              color: "var(--ap-ink)",
              fontFamily: "inherit",
              lineHeight: 1.55,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ap-ink)")}
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = "var(--ap-line-2)")
            }
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          disabled={submitting}
          onClick={() => submit("APPROVED")}
          className="ap-btn ap-btn--stamp"
          style={{
            padding: "14px 28px",
            fontSize: 14,
            opacity: submitting ? 0.5 : 1,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting && decision === "APPROVED"
            ? "Enviando…"
            : "Aprobar y publicar"}
        </button>

        {decision !== "REJECTED" ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => setDecision("REJECTED")}
            className="ap-btn ap-btn--ghost"
            style={{ padding: "14px 22px", fontSize: 14 }}
          >
            Rechazar
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit("REJECTED")}
            className="ap-btn ap-btn--ghost"
            style={{
              padding: "14px 22px",
              fontSize: 14,
              opacity: submitting ? 0.5 : 1,
              cursor: submitting ? "wait" : "pointer",
            }}
          >
            {submitting ? "Enviando…" : "Confirmar rechazo"}
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "var(--ap-paper-2)",
            borderLeft: "2px solid var(--ap-stamp)",
            fontSize: 13,
            color: "var(--ap-ink-2)",
            margin: "14px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
