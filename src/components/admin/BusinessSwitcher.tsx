"use client";

/**
 * BusinessSwitcher — dropdown editorial para cambiar entre cuentas
 * sin volver a /businesses. Aparece en el header del business layout.
 *
 * Si el user solo tiene 1 cuenta → renderiza un link plano "← Cuentas".
 * Si tiene 2+ → muestra el dropdown con la cuenta actual + lista clickable.
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Check } from "lucide-react";

interface BusinessOption {
  id: string;
  name: string;
  slug: string;
  igUsername: string | null;
  igConnected: boolean;
}

interface Props {
  currentSlug: string;
  businesses: BusinessOption[];
}

export function BusinessSwitcher({ currentSlug, businesses }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = businesses.find((b) => b.slug === currentSlug);
  const others = businesses.filter((b) => b.slug !== currentSlug);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  // Solo 1 cuenta: link plano
  if (businesses.length <= 1) {
    return (
      <Link
        href="/businesses"
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        ← Cuentas
      </Link>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ap-mono"
        style={{
          background: open ? "var(--ap-paper-2)" : "transparent",
          border: "1px solid var(--ap-line-2)",
          padding: "6px 10px 6px 12px",
          fontSize: 10,
          color: "var(--ap-ink-3)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>Cambiar cuenta</span>
        <ChevronDown
          strokeWidth={1.5}
          style={{
            width: 12,
            height: 12,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            minWidth: 280,
            maxHeight: 360,
            overflowY: "auto",
            background: "var(--ap-paper)",
            border: "1px solid var(--ap-ink)",
            boxShadow: "3px 3px 0 var(--ap-ink)",
            padding: 4,
          }}
        >
          {/* Cuenta actual con check */}
          {current && (
            <div
              style={{
                padding: "10px 12px",
                background: "var(--ap-paper-2)",
                borderBottom: "1px solid var(--ap-line-2)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Check
                strokeWidth={2}
                style={{ width: 14, height: 14, color: "var(--ap-stamp)", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink)", fontWeight: 600 }}>
                  {current.name}
                </p>
                <p
                  className="ap-mono"
                  style={{
                    margin: "2px 0 0",
                    fontSize: 9,
                    color: current.igConnected ? "var(--ap-olive)" : "var(--ap-ink-4)",
                    letterSpacing: "0.1em",
                  }}
                >
                  {current.igConnected ? `@${current.igUsername} · activo` : "sin Instagram"}
                </p>
              </div>
            </div>
          )}

          {/* Otras cuentas */}
          {others.length > 0 && (
            <div>
              <p
                className="ap-mono"
                style={{
                  margin: "8px 12px 4px",
                  fontSize: 9,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Otras cuentas
              </p>
              {others.map((b) => (
                <Link
                  key={b.id}
                  href={`/businesses/${b.slug}/chat`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    color: "var(--ap-ink)",
                    textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "var(--ap-paper-2)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      width: 14,
                      flexShrink: 0,
                      textAlign: "center",
                      color: "var(--ap-ink-4)",
                      fontSize: 12,
                    }}
                  >
                    ›
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink)" }}>{b.name}</p>
                    <p
                      className="ap-mono"
                      style={{
                        margin: "2px 0 0",
                        fontSize: 9,
                        color: b.igConnected ? "var(--ap-olive)" : "var(--ap-ink-4)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {b.igConnected ? `@${b.igUsername}` : "sin Instagram"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Footer: añadir cuenta + ver todas */}
          <div
            style={{
              borderTop: "1px solid var(--ap-line-2)",
              marginTop: 4,
              padding: "4px 0",
            }}
          >
            <Link
              href="/businesses/new"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                color: "var(--ap-stamp)",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <Plus strokeWidth={2} style={{ width: 14, height: 14 }} />
              Añadir nueva cuenta
            </Link>
            <Link
              href="/businesses"
              onClick={() => setOpen(false)}
              className="ap-mono"
              style={{
                display: "block",
                padding: "8px 12px",
                color: "var(--ap-ink-3)",
                textDecoration: "none",
                fontSize: 9,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Ver todas las cuentas →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
