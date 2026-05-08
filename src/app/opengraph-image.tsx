import { ImageResponse } from "next/og";

/**
 * Open Graph image dinámica · 1200x630.
 * Sirve automáticamente como og:image y twitter:image de la home.
 *
 * Satori (engine de next/og) es estricto: TODO <div> con más de un hijo
 * necesita display: "flex" o "display: none" explícito. No respeta el
 * default block del browser.
 */
export const runtime = "edge";
export const alt = "Autopost — Tira la carpeta. El resto va solo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0E0F0D",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#EDEAE3",
        }}
      >
        {/* Eyebrow + logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              background: "#FF6A2C",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#EDEAE3",
            }}
          >
            <span>autopost</span>
            <span style={{ color: "#FF6A2C" }}>.</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "108px",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              color: "#EDEAE3",
            }}
          >
            Tira la carpeta.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "108px",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              color: "#FF6A2C",
            }}
          >
            El resto va solo.
          </div>
        </div>

        {/* Footer trust strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "22px",
            color: "#A8A69E",
          }}
        >
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <span>7 redes</span>
            <span style={{ color: "#3A3D38" }}>·</span>
            <span>Sin permanencia</span>
            <span style={{ color: "#3A3D38" }}>·</span>
            <span>7 días gratis</span>
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              background: "#FF6A2C",
              color: "#0A0B09",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            autopost.app
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
