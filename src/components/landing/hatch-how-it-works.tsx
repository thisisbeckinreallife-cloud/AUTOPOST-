"use client";

/* ──────────────────────────────────────────────────────────────────────
   HatchHowItWorks — versión EDITORIAL (print-zine).
   Tres pasos en grid magazine, mockups SVG redibujados en ink+stamp,
   strip diferencial en bloque ink invertido. Copy preservado.
   "Hatch" → "AutoPost" en todo el texto.
   ────────────────────────────────────────────────────────────────────── */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Folder, Calendar, Sparkles } from "lucide-react";
import {
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
  EASE_CINEMATIC,
} from "@/components/motion";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { Icon } from "@/components/editorial/atoms";
import { RichText } from "@/components/editorial/RichText";

export function HatchHowItWorks() {
  return (
    <>
      <MagazineSection
        index="01"
        kicker="CÓMO FUNCIONA"
        title={
          <>
            Tres pasos. <i>Cero clicks de más.</i>
          </>
        }
        lede="No hay setup ni 17 tutoriales. Sueltas la carpeta. AutoPost lee, agrupa y programa. Tú confirmas y vuelves a tu vida."
        id="como-funciona"
      >
        <div
          style={{
            borderTop: "1px solid var(--ap-rule)",
            borderBottom: "1px solid var(--ap-rule)",
          }}
        >
        <MotionStagger
          stagger={0.12}
          className="grid grid-cols-1 md:grid-cols-3"
        >
          <MotionStaggerItem>
            <Step
              n="01"
              icon={Folder}
              title="Suelta la carpeta"
              description="Una carpeta con fotos, vídeos y .txt. AutoPost detecta el patrón sin que numeres nada."
              mockup={<MockStep1 />}
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <Step
              n="02"
              icon={Sparkles}
              title="AutoPost lee y agrupa"
              description="Carruseles, posts únicos, reels — cada uno con su copy asociado. Listo en segundos."
              mockup={<MockStep2 />}
              highlight
              borderLeft
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <Step
              n="03"
              icon={Calendar}
              title="Confirma y olvida"
              description="Eliges horario y modo de publicación. AutoPost publica directo vía API oficial de Meta."
              mockup={<MockStep3 />}
              borderLeft
            />
          </MotionStaggerItem>
        </MotionStagger>
        </div>
      </MagazineSection>

      <DifferentialStrip />
    </>
  );
}

interface StepProps {
  n: string;
  icon: React.ElementType;
  title: string;
  description: string;
  mockup: React.ReactNode;
  highlight?: boolean;
  borderLeft?: boolean;
}

function Step({
  n,
  icon: StepIcon,
  title,
  description,
  mockup,
  highlight,
  borderLeft,
}: StepProps) {
  return (
    <div
      className="relative h-full flex flex-col"
      style={{
        padding: "clamp(28px, 3.5vw, 44px) clamp(24px, 3vw, 36px)",
        borderLeft: borderLeft ? "1px solid var(--ap-line)" : "none",
        background: highlight ? "var(--ap-paper-2)" : "var(--ap-paper)",
      }}
    >
      <div className="flex items-baseline gap-4 mb-6">
        <span
          className="ap-display"
          style={{
            fontSize: 48,
            fontStyle: "italic",
            color: "var(--ap-stamp)",
            letterSpacing: "-0.03em",
            lineHeight: 0.85,
          }}
        >
          {n}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            border: "1px solid var(--ap-ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: highlight ? "var(--ap-stamp)" : "var(--ap-ink)",
          }}
        >
          <StepIcon strokeWidth={1.5} className="h-4 w-4" />
        </div>
        {highlight && (
          <span
            className="ap-stamp-chip ml-auto"
            style={{ transform: "rotate(-3deg)" }}
          >
            Núcleo
          </span>
        )}
      </div>

      <h3
        className="ap-display"
        style={{
          fontSize: "clamp(20px, 1.8vw, 26px)",
          fontStyle: "italic",
          color: "var(--ap-ink)",
          letterSpacing: "-0.015em",
          lineHeight: 1.1,
          margin: "0 0 12px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--ap-ink-3)",
          lineHeight: 1.6,
          margin: 0,
          marginBottom: 24,
        }}
      >
        {description}
      </p>

      <div className="mt-auto">{mockup}</div>
    </div>
  );
}

/* ─── Mockups SVG redibujados ────────────────────────────────────── */

function MockStep1() {
  return (
    <div
      style={{
        position: "relative",
        height: 140,
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
        padding: 16,
        overflow: "hidden",
      }}
    >
      <motion.svg
        viewBox="0 0 200 100"
        style={{ width: "100%", height: "100%" }}
        initial={{ y: -8, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE_CINEMATIC }}
      >
        <path
          d="M40 30 L80 30 L88 38 L160 38 L160 78 L40 78 Z"
          fill="var(--ap-ink)"
          stroke="var(--ap-ink)"
          strokeWidth="1.5"
        />
        <rect x="40" y="26" width="44" height="6" fill="var(--ap-ink-2)" />
        <circle cx="148" cy="56" r="4" fill="var(--ap-stamp)" />
      </motion.svg>
      <p
        className="ap-mono"
        style={{
          position: "absolute",
          bottom: 10,
          left: 16,
          fontSize: 9,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        ↓ soltar aquí
      </p>
    </div>
  );
}

function MockStep2() {
  const rows = [
    { label: "carrusel-ss26.jpg", tag: "CARRUSEL", stamp: true },
    { label: "lanzamiento.txt", tag: "COPY", stamp: false },
    { label: "reel-taller.mp4", tag: "REEL", stamp: false },
  ];
  return (
    <div
      style={{
        height: 140,
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "hidden",
      }}
    >
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex items-center justify-between"
          style={{
            padding: "8px 10px",
            background: "var(--ap-paper)",
            fontFamily: "var(--ap-font-mono)",
            fontSize: 9,
          }}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.2 + i * 0.15,
            duration: 0.5,
            ease: EASE_CINEMATIC,
          }}
        >
          <span style={{ color: "var(--ap-ink-3)" }}>{row.label}</span>
          <span
            style={{
              fontSize: 8,
              padding: "2px 6px",
              background: row.stamp ? "var(--ap-stamp)" : "transparent",
              color: row.stamp ? "var(--ap-paper)" : "var(--ap-ink-3)",
              border: row.stamp ? "none" : "1px solid var(--ap-line-2)",
              letterSpacing: "0.1em",
              fontWeight: 600,
            }}
          >
            {row.tag}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function MockStep3() {
  const cells = Array.from({ length: 21 });
  const lit = new Set([0, 2, 4, 6, 8, 10, 13, 15, 17, 20]);
  return (
    <div
      style={{
        height: 140,
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
        padding: 16,
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gridTemplateRows: "repeat(3, 1fr)",
        gap: 4,
      }}
    >
      {cells.map((_, i) => {
        const isLit = lit.has(i);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.05 * i,
              duration: 0.4,
              ease: EASE_CINEMATIC,
            }}
            style={{
              background: isLit ? "var(--ap-ink)" : "transparent",
              border: isLit ? "none" : "1px solid var(--ap-line-2)",
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Differential strip — bloque ink invertido ──────────────────── */

function DifferentialStrip() {
  return (
    <section
      className="ap-root relative overflow-hidden"
      style={{
        background: "var(--ap-ink)",
        color: "var(--ap-paper)",
        padding: "clamp(64px, 10vw, 128px) clamp(20px, 5vw, 56px)",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <MotionReveal direction="up" cinematic>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-center">
            <div>
              <span
                className="ap-stamp-chip"
                style={{
                  background: "transparent",
                  borderColor: "var(--ap-stamp)",
                  color: "var(--ap-stamp)",
                  marginBottom: 24,
                  display: "inline-block",
                }}
              >
                Único en el mercado
              </span>
              <h3
                className="ap-display"
                style={{
                  fontSize: "clamp(28px, 4vw, 56px)",
                  fontStyle: "italic",
                  color: "var(--ap-paper)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  margin: 0,
                  maxWidth: 720,
                }}
              >
                Buffer programa{" "}
                <s
                  style={{
                    textDecorationColor: "var(--ap-stamp)",
                    textDecorationThickness: "2px",
                  }}
                >
                  post a post
                </s>
                .
                <br />
                AutoPost programa{" "}
                <RichText text="<wave>carpeta a carpeta</wave>" />.
              </h3>
              <p
                style={{
                  fontSize: "clamp(15px, 1.4vw, 17px)",
                  color: "rgba(241, 236, 226, 0.70)",
                  lineHeight: 1.55,
                  margin: "20px 0 0",
                  maxWidth: 540,
                }}
              >
                Suelta una carpeta. Detectamos carruseles, asociamos copy y
                programamos 30 días en un par de minutos. Sin numerar fotos.
                Sin pegar capciones a mano.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link
                href="/signup"
                className="ap-btn ap-btn--stamp"
                style={{
                  padding: "14px 22px",
                  fontSize: 13,
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                }}
              >
                Probar gratis
                <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
              </Link>
              <Link
                href="#precios"
                className="ap-btn ap-btn--ghost"
                style={{
                  padding: "14px 22px",
                  fontSize: 13,
                  background: "transparent",
                  color: "var(--ap-paper)",
                  borderColor: "var(--ap-paper)",
                  display: "inline-flex",
                  whiteSpace: "nowrap",
                }}
              >
                Ver precios
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: 64,
              borderTop: "1px solid rgba(241, 236, 226, 0.20)",
              paddingTop: 32,
            }}
          >
            <CompareTeaser />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

function CompareTeaser() {
  const rows = [
    { label: "Subes", autopost: "Una carpeta", others: "Cada post a mano" },
    { label: "Carruseles", autopost: "Detectados", others: "Numera tú" },
    { label: "Copy", autopost: "Extraído del .txt", others: "Copy/paste" },
    { label: "Tiempo / cliente", autopost: "2 min", others: "2-3 horas" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-4 md:gap-8">
      <div
        className="ap-mono"
        style={{
          fontSize: 10,
          color: "rgba(241, 236, 226, 0.50)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Comparativa
      </div>
      <div>
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-stamp)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          AutoPost
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-baseline gap-3"
              style={{
                padding: "10px 0",
                borderTop: "1px solid rgba(241, 236, 226, 0.15)",
                fontSize: 14,
                color: "var(--ap-paper)",
              }}
            >
              <Icon name="check" size={12} c="var(--ap-stamp)" sw={1.8} />
              <span>{r.autopost}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "rgba(241, 236, 226, 0.50)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          Otros schedulers
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-baseline gap-3"
              style={{
                padding: "10px 0",
                borderTop: "1px solid rgba(241, 236, 226, 0.15)",
                fontSize: 14,
                color: "rgba(241, 236, 226, 0.55)",
              }}
            >
              <Icon name="x" size={12} c="rgba(241, 236, 226, 0.55)" sw={1.5} />
              <s style={{ textDecorationColor: "var(--ap-stamp)" }}>{r.others}</s>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
