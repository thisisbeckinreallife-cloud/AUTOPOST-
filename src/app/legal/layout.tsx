/**
 * Layout compartido para páginas legales (privacy, terms, cookies).
 * Tono editorial print-zine — papel + tinta, ap-display italic, ap-mono.
 */
import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="ap-root"
      style={{
        background: "var(--ap-paper)",
        minHeight: "100vh",
        color: "var(--ap-ink)",
      }}
    >
      {/* Header minimal */}
      <header
        style={{
          padding: "clamp(20px, 4vw, 36px) clamp(20px, 5vw, 56px)",
          borderBottom: "1px solid var(--ap-line)",
        }}
      >
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <Link
            href="/"
            className="ap-display"
            style={{
              fontSize: 28,
              fontStyle: "italic",
              color: "var(--ap-ink)",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            AutoPost
          </Link>
          <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <Link href="/legal/privacy" className="ap-mono" style={legalNavStyle}>
              Privacidad
            </Link>
            <Link href="/legal/terms" className="ap-mono" style={legalNavStyle}>
              Términos
            </Link>
            <Link href="/legal/cookies" className="ap-mono" style={legalNavStyle}>
              Cookies
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenido */}
      <main
        style={{
          padding: "clamp(36px, 6vw, 80px) clamp(20px, 5vw, 56px)",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>{children}</div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: "32px clamp(20px, 5vw, 56px)",
          borderTop: "1px solid var(--ap-line)",
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            ✦ AutoPost · MMXXVI
          </p>
          <Link
            href="/"
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            ← Volver al inicio
          </Link>
        </div>
      </footer>
    </div>
  );
}

const legalNavStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--ap-ink-3)",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  textDecoration: "none",
};
