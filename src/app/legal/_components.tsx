/**
 * Componentes editoriales compartidos para las páginas legales.
 * Mantienen el lenguaje papel + tinta + Instrument Serif italic.
 */
import * as React from "react";

export function LegalTitle({
  index,
  kicker,
  title,
  lede,
  updated,
}: {
  index: string;
  kicker: string;
  title: string;
  lede?: string;
  updated: string;
}) {
  return (
    <header style={{ marginBottom: 56 }}>
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
        {index} · {kicker}
      </p>
      <h1
        className="ap-display"
        style={{
          fontSize: "clamp(40px, 6vw, 72px)",
          fontStyle: "italic",
          lineHeight: 0.96,
          letterSpacing: "-0.02em",
          color: "var(--ap-ink)",
          margin: 0,
        }}
      >
        {title}
      </h1>
      {lede && (
        <p
          style={{
            marginTop: 20,
            fontSize: "clamp(15px, 1.4vw, 18px)",
            lineHeight: 1.55,
            color: "var(--ap-ink-3)",
            fontStyle: "italic",
          }}
        >
          {lede}
        </p>
      )}
      <p
        className="ap-mono"
        style={{
          marginTop: 24,
          fontSize: 10,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        Última actualización · {updated}
      </p>
    </header>
  );
}

export function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontSize: 13,
          color: "var(--ap-ink-2)",
          margin: "0 0 16px",
          fontFamily: "var(--ap-font-mono)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
          display: "flex",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <span style={{ color: "var(--ap-stamp)" }}>§{number}</span>
        <span>{title}</span>
      </h2>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--ap-ink-2)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function Para({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 14px" }}>{children}</p>;
}

export function List({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        margin: "0 0 14px",
        padding: "0 0 0 20px",
        listStyle: "square",
      }}
    >
      {children}
    </ul>
  );
}

export function Item({ children }: { children: React.ReactNode }) {
  return <li style={{ margin: "6px 0" }}>{children}</li>;
}

export function Strong({ children }: { children: React.ReactNode }) {
  return (
    <strong style={{ color: "var(--ap-ink)", fontWeight: 600 }}>{children}</strong>
  );
}
