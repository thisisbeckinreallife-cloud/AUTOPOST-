"use client";

import * as React from "react";
import { MotionReveal } from "@/components/motion";

interface MagazineSectionProps {
  /** Número de sección zero-padded, ej "01" */
  index: string;
  /** Eyebrow mono uppercase, ej "FEATURES" */
  kicker: string;
  /** h2 italic display — admite RichText/JSX */
  title: React.ReactNode;
  /** Subtítulo opcional 15-18px */
  lede?: React.ReactNode;
  /** Default "left" — "center" se reserva a CTA y FAQ */
  align?: "center" | "left";
  /** Hairline superior antes del header (default true) */
  rule?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Header magazine compartido por todas las secciones del landing editorial.
 *
 * Estructura visual:
 *   ── hairline ──
 *   [01]   FEATURES
 *          Título italic display
 *          lede 15-18px ink-3
 *   {children}
 *
 * En align="center" el índice se inline con el kicker ("01 · FEATURES")
 * y el título queda centrado.
 *
 * Mobile (<640px): grid colapsa a 1 columna, índice inline arriba del kicker.
 */
export const MagazineSection: React.FC<MagazineSectionProps> = ({
  index,
  kicker,
  title,
  lede,
  align = "left",
  rule = true,
  id,
  className,
  children,
}) => {
  const isCenter = align === "center";

  return (
    <section
      id={id}
      className={`ap-root relative ${className ?? ""}`}
      style={{
        background: "var(--ap-paper)",
        padding: "clamp(64px, 9vw, 128px) clamp(20px, 5vw, 56px)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {rule && (
          <hr
            className="ap-rule"
            style={{ marginBottom: 28, opacity: 0.55 }}
          />
        )}
        <MotionReveal direction="up" cinematic>
          <header
            className="ms-header"
            style={{
              display: "grid",
              gridTemplateColumns: isCenter ? "1fr" : "minmax(80px, 110px) 1fr",
              gap: isCenter ? 0 : 28,
              alignItems: "baseline",
              marginBottom: "clamp(36px, 5vw, 64px)",
              textAlign: isCenter ? "center" : "left",
            }}
          >
            {!isCenter && (
              <span
                className="ap-index ms-index"
                style={{
                  fontSize: "clamp(48px, 7vw, 80px)",
                  display: "block",
                }}
              >
                {index}
              </span>
            )}
            <div>
              <p
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                }}
              >
                {isCenter ? `${index} · ${kicker}` : kicker}
              </p>
              <h2
                className="ap-display"
                style={{
                  fontSize: "clamp(40px, 6.5vw, 96px)",
                  fontStyle: "italic",
                  lineHeight: 0.95,
                  letterSpacing: "-0.02em",
                  color: "var(--ap-ink)",
                  margin: 0,
                  maxWidth: 920,
                  ...(isCenter ? { marginInline: "auto" } : {}),
                }}
              >
                {title}
              </h2>
              {lede && (
                <p
                  style={{
                    marginTop: 20,
                    fontSize: "clamp(15px, 1.4vw, 18px)",
                    lineHeight: 1.55,
                    color: "var(--ap-ink-3)",
                    maxWidth: 560,
                    ...(isCenter ? { marginInline: "auto" } : {}),
                  }}
                >
                  {lede}
                </p>
              )}
            </div>
          </header>
        </MotionReveal>
        {children}
      </div>

      {/* Mobile collapse: índice inline arriba del kicker */}
      <style jsx>{`
        @media (max-width: 640px) {
          .ms-header {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .ms-index {
            font-size: 40px !important;
            margin-bottom: 4px;
          }
        }
      `}</style>
    </section>
  );
};
