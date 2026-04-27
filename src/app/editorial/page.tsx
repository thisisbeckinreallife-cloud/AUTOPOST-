"use client";

import * as React from "react";
import { I18nProvider } from "@/components/editorial/i18n";
import { EditorialHero } from "@/components/editorial/EditorialHero";
import { HomeScreen } from "@/components/editorial/HomeScreen";

export default function EditorialPage() {
  return (
    <I18nProvider defaultLang="es">
      <DesignCanvas>
        <DCSection
          id="hero"
          title="01 · Hero — Editorial / Print-zine"
          subtitle="Off-bone paper, tomato stamp, Instrument Serif at scale. 3-page animated story (brief · drafts · week)"
        >
          <DCArtboard
            id="hero-final"
            label="Landing hero · editorial"
            width={1440}
            height={1700}
          >
            <EditorialHero />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="dash"
          title="02 · Dashboard — same DNA, applied"
          subtitle="Magazine masthead, italic numbers, hand-written notes, kitchen-ticket queue"
        >
          <DCArtboard
            id="home"
            label="Home · today's run-of-show"
            width={1280}
            height={920}
          >
            <HomeScreen />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>
    </I18nProvider>
  );
}

/* ─── Design Canvas primitives ────────────────────────────────────────── */

const DesignCanvas: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      minHeight: "100vh",
      background: "#F1ECE2",
      padding: "56px 24px 96px",
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    }}
  >
    <div style={{ maxWidth: 1500, margin: "0 auto" }}>
      <div style={{ marginBottom: 64 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#8A7E6B",
            fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
          }}
        >
          Autopost · Editorial Study
        </p>
        <h1
          style={{
            margin: "10px 0 0",
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            fontFamily: '"Instrument Serif", "Times New Roman", serif',
            color: "#14110D",
          }}
        >
          Brand &amp; Product —{" "}
          <span style={{ fontStyle: "italic", color: "#E54B26" }}>artboards</span>
        </h1>
      </div>
      {children}
    </div>
  </div>
);

const DCSection: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ id, title, subtitle, children }) => (
  <section id={id} style={{ marginBottom: 80 }}>
    <header style={{ marginBottom: 28 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontFamily: '"Instrument Serif", "Times New Roman", serif',
          fontStyle: "italic",
          color: "#14110D",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "#5A4F40",
            maxWidth: 720,
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {children}
    </div>
  </section>
);

const DCArtboard: React.FC<{
  id: string;
  label: string;
  width: number;
  height: number;
  children: React.ReactNode;
}> = ({ id, label, width, height, children }) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const apply = () => {
      const scale = wrap.clientWidth / width;
      inner.style.transform = `scale(${scale})`;
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [width]);

  return (
    <figure id={id} style={{ margin: 0 }}>
      <figcaption
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
          fontFamily: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#8A7E6B",
        }}
      >
        <span>{label}</span>
        <span>
          {width} × {height}
        </span>
      </figcaption>
      <div
        ref={wrapRef}
        style={{
          width: "100%",
          maxWidth: width,
          aspectRatio: `${width} / ${height}`,
          background: "#F1ECE2",
          boxShadow:
            "0 1px 0 rgba(20,17,13,0.06), 0 30px 60px -20px rgba(20,17,13,0.18)",
          border: "1px solid rgba(20,17,13,0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          ref={innerRef}
          style={{
            width,
            height,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </figure>
  );
};
