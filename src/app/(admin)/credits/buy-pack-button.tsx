"use client";

/**
 * Botón "Comprar pack" — placeholder hasta Sprint 5 (Stripe).
 * Por ahora muestra modal con instrucciones para contactar.
 */
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function BuyPackButton({ packKey }: { packKey: string }) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function requestPurchase() {
    setSubmitting(true);
    try {
      // Sprint 5 enchufará Stripe checkout. Por ahora registramos la intención.
      toast(
        "Stripe en construcción. Mientras tanto, escríbenos a hello@autopost.app y te activamos el pack manualmente.",
        "info",
      );
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="ap-btn ap-btn--stamp"
        style={{
          padding: "10px 14px",
          fontSize: 12,
          fontFamily: "var(--ap-font-mono)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          width: "100%",
        }}
      >
        Comprar
      </button>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(20,17,13,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--ap-paper)",
              border: "1.5px solid var(--ap-ink)",
              padding: "32px 28px",
              maxWidth: 460,
              width: "100%",
            }}
          >
            <p
              className="ap-mono"
              style={{
                fontSize: 11,
                color: "var(--ap-stamp)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              ✦ Próximamente
            </p>
            <h3
              className="ap-display"
              style={{
                fontSize: 28,
                fontStyle: "italic",
                lineHeight: 1.05,
                margin: "10px 0 14px",
                color: "var(--ap-ink)",
              }}
            >
              Stripe llega en <i>Sprint 5</i>
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "var(--ap-ink-3)",
                lineHeight: 1.55,
                margin: "0 0 20px",
              }}
            >
              El checkout automático con Stripe se activa la semana que viene.
              Mientras tanto, escríbenos a{" "}
              <strong>hello@autopost.app</strong> con el pack que quieres
              <strong> ({packKey})</strong> y te abonamos los créditos
              manualmente en menos de 1 hora hábil.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={requestPurchase}
                disabled={submitting}
                className="ap-btn ap-btn--stamp"
                style={{ padding: "10px 16px", fontSize: 13 }}
              >
                {submitting ? "Enviando…" : "OK, contacto"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="ap-btn ap-btn--ghost"
                style={{ padding: "10px 16px", fontSize: 13 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
