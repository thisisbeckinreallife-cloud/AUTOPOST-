"use client";

import { motion } from "framer-motion";
import { ArrowRight, FolderOpen, Sparkles, CalendarCheck } from "lucide-react";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────────────
   HatchHowItWorks — sección que aparece justo después del hero pinned.
   3 pasos concretos: 1) Sueltas la carpeta · 2) Hatch entiende ·
   3) 30 días programados. Layout cinemático con micro-mockups
   reales (no abstracciones).
   ──────────────────────────────────────────────────────────────────── */

const HATCH = {
  graphite: "#1D1D1F",
  graphiteAlt: "#2C2C2E",
  athens: "#F5F5F7",
  surfAlt: "#E8E8ED",
  silver: "#86868B",
  silverDark: "#48484A",
  glow: "#A8DADC",
  cobalt: "#7DBCBE",
  textOnDark: "#F5F5F7",
};

export function HatchHowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative overflow-hidden py-24 sm:py-32 px-6"
      style={{ background: HATCH.athens }}
    >
      {/* Top transition divider — gradient from previous section */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${HATCH.athens} 100%)`,
        }}
      />

      {/* Subtle grid background pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${HATCH.graphite} 1px, transparent 1px), linear-gradient(90deg, ${HATCH.graphite} 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, black 40%, transparent 80%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 sm:mb-20"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide mb-6"
            style={{
              background: "rgba(29,29,31,0.06)",
              border: "1px solid rgba(29,29,31,0.10)",
              color: HATCH.silverDark,
            }}
          >
            CÓMO FUNCIONA
          </div>
          <h2
            className="font-extrabold tracking-tight max-w-3xl mx-auto"
            style={{
              color: HATCH.graphite,
              fontSize: "clamp(2rem, 5vw, 3.6rem)",
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            }}
          >
            Tres pasos.{" "}
            <span style={{ color: HATCH.silver }}>
              Cero clicks de más.
            </span>
          </h2>
          <p
            className="mt-5 max-w-xl mx-auto"
            style={{ color: HATCH.silverDark, fontSize: "1.05rem", lineHeight: 1.55 }}
          >
            No hay setup, ni 17 tutoriales. Es lo que ya haces — meter posts en una carpeta — pero la programación la hacemos nosotros.
          </p>
        </motion.div>

        {/* Three steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          <Step
            n="01"
            icon={<FolderOpen className="h-5 w-5" />}
            title="Suelta la carpeta"
            description="Drag&drop una carpeta o ZIP. Da igual cómo esté organizada — la entendemos."
            mockup={<MockStep1 />}
            delay={0}
          />
          <Step
            n="02"
            icon={<Sparkles className="h-5 w-5" />}
            title="Hatch lee y agrupa"
            description="Detecta carruseles, lee los caption.txt, ordena por fecha. Tú revisas, no construyes."
            mockup={<MockStep2 />}
            delay={0.1}
            highlight
          />
          <Step
            n="03"
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Confirma y olvida"
            description="Eliges horario y modo de publicación. Hatch publica directo vía API oficial de Meta."
            mockup={<MockStep3 />}
            delay={0.2}
          />
        </div>

        {/* The differential strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-20 sm:mt-24 rounded-3xl overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${HATCH.graphite} 0%, ${HATCH.graphiteAlt} 100%)`,
            border: `1px solid rgba(168,218,220,0.18)`,
            boxShadow: `0 32px 80px -24px rgba(15,15,20,0.45), 0 0 0 1px rgba(168,218,220,0.08), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Aurora glow inside */}
          <div
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, ${HATCH.glow}33 0%, transparent 70%)`,
              filter: "blur(60px)",
            }}
          />

          <div className="relative px-8 sm:px-12 py-12 sm:py-16 grid md:grid-cols-[1.2fr,1fr] gap-10 items-center">
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest mb-5"
                style={{
                  background: "rgba(168,218,220,0.14)",
                  border: "1px solid rgba(168,218,220,0.30)",
                  color: HATCH.glow,
                }}
              >
                ÚNICO EN EL MERCADO
              </div>
              <h3
                className="font-extrabold tracking-tight mb-4"
                style={{
                  color: HATCH.textOnDark,
                  fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                  fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                }}
              >
                Buffer programa post a post.<br />
                <span style={{ color: HATCH.glow }}>Hatch programa carpeta a carpeta.</span>
              </h3>
              <p
                className="mb-6"
                style={{
                  color: "rgba(245,245,247,0.70)",
                  fontSize: "1rem",
                  lineHeight: 1.55,
                  maxWidth: 480,
                }}
              >
                Es la única herramienta del mercado que detecta tus carruseles desde la estructura de archivos. Sin numerar fotos. Sin renombrar nada. Sin perder dos horas el lunes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: HATCH.glow,
                    color: HATCH.graphite,
                    boxShadow: `0 12px 32px -8px ${HATCH.glow}66, 0 0 0 1px ${HATCH.glow}80`,
                  }}
                >
                  Probar gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#comparativa"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-full border transition-colors hover:bg-white/5"
                  style={{ borderColor: "rgba(168,218,220,0.25)", color: "rgba(245,245,247,0.85)" }}
                >
                  Ver comparativa
                </Link>
              </div>
            </div>

            {/* Right side — comparison teaser */}
            <CompareTeaser />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Step Card ────────────────────────────────────────────────── */
function Step({ n, icon, title, description, mockup, delay = 0, highlight = false }: {
  n: string; icon: React.ReactNode; title: string; description: string; mockup: React.ReactNode; delay?: number; highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl p-6 sm:p-7 group"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        border: highlight ? `1px solid rgba(168,218,220,0.45)` : `1px solid rgba(29,29,31,0.06)`,
        boxShadow: highlight
          ? `0 12px 32px -8px rgba(168,218,220,0.20), 0 0 0 1px rgba(168,218,220,0.20), inset 0 1px 0 rgba(255,255,255,0.7)`
          : `0 4px 20px -6px rgba(29,29,31,0.06), inset 0 1px 0 rgba(255,255,255,0.7)`,
      }}
    >
      {/* Mockup area */}
      <div
        className="relative mb-6 rounded-xl overflow-hidden h-40 sm:h-44 flex items-center justify-center"
        style={{
          background: highlight ? `linear-gradient(135deg, ${HATCH.athens} 0%, ${HATCH.surfAlt} 100%)` : HATCH.surfAlt,
          border: `1px solid rgba(29,29,31,0.05)`,
        }}
      >
        {mockup}
      </div>

      {/* Step number + icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{
              background: highlight ? `${HATCH.glow}22` : `${HATCH.graphite}10`,
              color: highlight ? HATCH.cobalt : HATCH.graphite,
              border: highlight ? `1px solid ${HATCH.glow}40` : "1px solid transparent",
            }}
          >
            {icon}
          </div>
          <span
            className="font-mono text-xs font-bold tracking-wider"
            style={{ color: HATCH.silver }}
          >
            STEP {n}
          </span>
        </div>
        {highlight && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: HATCH.glow,
              color: HATCH.graphite,
            }}
          >
            ÚNICO
          </span>
        )}
      </div>

      <h3
        className="font-bold mb-2"
        style={{
          color: HATCH.graphite,
          fontSize: "1.15rem",
          letterSpacing: "-0.015em",
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: HATCH.silverDark,
          fontSize: "0.92rem",
          lineHeight: 1.55,
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}

/* ─── Step Mockups (mini visuals) ─────────────────────────────── */

function MockStep1() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Folder being dropped */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
        style={{
          filter: "drop-shadow(0 8px 16px rgba(15,15,20,0.18))",
        }}
      >
        <svg width="92" height="76" viewBox="0 0 92 76">
          <defs>
            <linearGradient id="m1body" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3A3A3D" />
              <stop offset="100%" stopColor="#1F1F22" />
            </linearGradient>
          </defs>
          <path d="M 6 16 Q 6 12 10 12 L 32 12 Q 36 12 38 16 L 42 22 L 6 22 Z" fill="#36363A" />
          <path d="M 4 22 L 88 22 Q 90 22 90 24 L 90 70 Q 90 74 86 74 L 8 74 Q 4 74 4 70 Z" fill="url(#m1body)" />
          <rect x="4" y="73" width="86" height="1" fill="#A8DADC" opacity="0.5" />
        </svg>
      </motion.div>
      {/* Drop indicator dashed */}
      <div
        className="absolute bottom-3 inset-x-3 h-px"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${HATCH.silver} 0 6px, transparent 6px 12px)`,
        }}
      />
      {/* Cursor */}
      <motion.div
        className="absolute top-2 right-3 text-xs"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ color: HATCH.silver }}
      >
        ↓ drop here
      </motion.div>
    </div>
  );
}

function MockStep2() {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-3">
      {/* File rows being detected */}
      <div className="w-full max-w-[200px] space-y-1.5">
        {[
          { name: "post-mojito.jpg", tag: "POST" },
          { name: "carrousel-01.jpg", tag: "CARRUSEL" },
          { name: "carrousel-02.jpg", tag: "CARRUSEL" },
          { name: "caption.txt", tag: "CAPTION" },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
            className="flex items-center justify-between text-[10px] px-2 py-1 rounded"
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(29,29,31,0.05)",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          >
            <span style={{ color: HATCH.silverDark }}>{f.name}</span>
            <span
              className="text-[8px] font-bold px-1 py-0.5 rounded"
              style={{
                background: f.tag === "CARRUSEL" ? `${HATCH.glow}33` : `${HATCH.graphite}10`,
                color: f.tag === "CARRUSEL" ? HATCH.cobalt : HATCH.silverDark,
              }}
            >
              {f.tag}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MockStep3() {
  const days = Array.from({ length: 21 });
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="grid grid-cols-7 gap-1">
        {days.map((_, i) => {
          const isLit = i < 18;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.025, ease: [0.34, 1.56, 0.64, 1] }}
              className="h-4 w-4 rounded-sm"
              style={{
                background: isLit ? HATCH.glow : "rgba(29,29,31,0.06)",
                border: isLit ? `0.5px solid ${HATCH.cobalt}80` : `0.5px solid rgba(29,29,31,0.10)`,
                boxShadow: isLit ? `0 0 6px ${HATCH.glow}66` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Compare teaser (right side of differential strip) ──────────── */

function CompareTeaser() {
  const rows = [
    { label: "Carga por carpeta/ZIP", hatch: true, others: false },
    { label: "Detección de carruseles", hatch: true, others: false },
    { label: "Posts colaborativos auto", hatch: true, others: false },
    { label: "Programación post a post", hatch: true, others: true },
    { label: "Multi-cuenta", hatch: true, others: true },
  ];
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(245,245,247,0.04)",
        border: "1px solid rgba(168,218,220,0.12)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="grid grid-cols-[1fr,auto,auto] gap-3 px-5 py-3 text-[10px] font-bold tracking-wider"
        style={{ borderBottom: "1px solid rgba(168,218,220,0.10)", color: HATCH.silver }}
      >
        <span>FEATURE</span>
        <span style={{ color: HATCH.glow }} className="px-1">HATCH</span>
        <span className="px-1">OTROS</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr,auto,auto] gap-3 px-5 py-2.5 text-xs items-center"
          style={{
            borderBottom: i < rows.length - 1 ? "1px solid rgba(168,218,220,0.08)" : "none",
            color: "rgba(245,245,247,0.85)",
          }}
        >
          <span>{row.label}</span>
          <span className="px-1 text-center">
            {row.hatch ? (
              <span style={{ color: HATCH.glow, fontSize: 14 }}>●</span>
            ) : (
              <span style={{ color: HATCH.silver, fontSize: 14, opacity: 0.4 }}>○</span>
            )}
          </span>
          <span className="px-1 text-center">
            {row.others ? (
              <span style={{ color: HATCH.silver, fontSize: 14, opacity: 0.6 }}>●</span>
            ) : (
              <span style={{ color: HATCH.silver, fontSize: 14, opacity: 0.25 }}>—</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
