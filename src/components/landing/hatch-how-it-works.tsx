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
  // Stack de 4 thumbnails fanned con líneas de hatch (representando fotos)
  const thumbs = [
    { rotate: -7, dx: -28, hatch: "diag-1", label: "01" },
    { rotate: -2, dx: -12, hatch: "diag-2", label: "02" },
    { rotate: 3, dx: 8, hatch: "diag-1", label: "03" },
    { rotate: 7, dx: 28, hatch: "diag-2", label: "04", stamp: true },
  ];

  return (
    <div
      style={{
        position: "relative",
        height: 160,
        background: "var(--ap-paper-2)",
        border: "1px dashed var(--ap-line-2)",
        overflow: "hidden",
      }}
    >
      {/* Stack de fotos */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) translateY(-8px)",
          width: 200,
          height: 100,
        }}
      >
        {thumbs.map((t, i) => (
          <motion.div
            key={i}
            initial={{ y: -32, opacity: 0, rotate: t.rotate - 8 }}
            whileInView={{
              y: 0,
              opacity: 1,
              rotate: t.rotate,
              x: t.dx,
            }}
            viewport={{ once: true }}
            transition={{
              delay: 0.15 + i * 0.12,
              duration: 0.6,
              ease: EASE_CINEMATIC,
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: -32,
              marginTop: -40,
              width: 64,
              height: 80,
              background: "var(--ap-paper)",
              border: "1px solid var(--ap-ink)",
              boxShadow: "2px 2px 0 rgba(20,17,13,0.10)",
              padding: 4,
            }}
          >
            {/* "imagen" — bandas hatch alternas */}
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  t.hatch === "diag-1"
                    ? "repeating-linear-gradient(45deg, var(--ap-ink-2) 0 1px, transparent 1px 4px)"
                    : "repeating-linear-gradient(-45deg, var(--ap-ink-3) 0 1px, transparent 1px 5px)",
                position: "relative",
              }}
            >
              {t.stamp && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    background: "var(--ap-stamp)",
                  }}
                />
              )}
            </div>
            <span
              className="ap-mono"
              style={{
                position: "absolute",
                bottom: 4,
                left: 6,
                fontSize: 7,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.08em",
              }}
            >
              {t.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Drop hint */}
      <p
        className="ap-mono"
        style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 9,
          color: "var(--ap-stamp)",
          letterSpacing: "0.18em",
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
  // Cada fila lleva una mini-visualización del contenido + filename + tag
  const rows = [
    {
      label: "carrusel-ss26",
      tag: "CARRUSEL",
      stamp: true,
      preview: "carousel" as const,
    },
    {
      label: "lanzamiento.txt",
      tag: "COPY",
      stamp: false,
      preview: "text" as const,
    },
    {
      label: "reel-taller.mp4",
      tag: "REEL",
      stamp: false,
      preview: "video" as const,
    },
  ];

  return (
    <div
      style={{
        height: 160,
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflow: "hidden",
      }}
    >
      {/* Header tipo terminal */}
      <div
        className="ap-mono flex items-center justify-between"
        style={{
          fontSize: 8,
          color: "var(--ap-ink-4)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          paddingBottom: 4,
          borderBottom: "1px solid var(--ap-line)",
          marginBottom: 4,
        }}
      >
        <span>3 elementos detectados</span>
        <span style={{ color: "var(--ap-stamp)" }}>● listo</span>
      </div>

      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          className="flex items-center gap-2.5"
          style={{
            padding: "5px 8px",
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
          {/* Preview mini */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
            {row.preview === "carousel" && (
              <div style={{ display: "flex", gap: 1.5 }}>
                {[0, 1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{
                      width: 10,
                      height: 10,
                      background:
                        j === 0
                          ? "var(--ap-ink)"
                          : "repeating-linear-gradient(45deg, var(--ap-ink-3) 0 1px, transparent 1px 3px)",
                      border: "0.5px solid var(--ap-ink)",
                    }}
                  />
                ))}
              </div>
            )}
            {row.preview === "text" && (
              <div
                style={{
                  width: 44,
                  height: 10,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  border: "0.5px solid var(--ap-ink)",
                  padding: "1.5px 2px",
                  background: "var(--ap-paper)",
                }}
              >
                <div style={{ height: 1, background: "var(--ap-ink-3)", width: "85%" }} />
                <div style={{ height: 1, background: "var(--ap-ink-3)", width: "60%" }} />
                <div style={{ height: 1, background: "var(--ap-ink-3)", width: "75%" }} />
              </div>
            )}
            {row.preview === "video" && (
              <div
                style={{
                  width: 18,
                  height: 10,
                  background: "var(--ap-ink)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: "4px solid var(--ap-paper)",
                    borderTop: "3px solid transparent",
                    borderBottom: "3px solid transparent",
                    marginLeft: 1,
                  }}
                />
              </div>
            )}
          </div>

          <span
            style={{
              flex: 1,
              color: "var(--ap-ink-2)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.label}
          </span>

          <span
            style={{
              fontSize: 7.5,
              padding: "2px 6px",
              background: row.stamp ? "var(--ap-stamp)" : "transparent",
              color: row.stamp ? "var(--ap-paper)" : "var(--ap-ink-3)",
              border: row.stamp ? "none" : "1px solid var(--ap-line-2)",
              letterSpacing: "0.12em",
              fontWeight: 600,
              flexShrink: 0,
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
  // Calendar magazine — semana de lunes a domingo, 4 filas. Días marcados
  // tienen un dot stamp tomate al estilo de un planner impreso.
  const weekdays = ["L", "M", "X", "J", "V", "S", "D"];
  // Mes empieza un miércoles (offset 2). 28 días útiles visibles.
  const offset = 2;
  const totalCells = 28;
  const scheduled = new Set([1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26]);

  return (
    <div
      style={{
        height: 160,
        background: "var(--ap-paper-2)",
        border: "1px solid var(--ap-line)",
        padding: "12px 14px",
        overflow: "hidden",
      }}
    >
      {/* Header tipo masthead */}
      <div
        className="flex items-baseline justify-between"
        style={{
          paddingBottom: 6,
          borderBottom: "1px solid var(--ap-line)",
          marginBottom: 8,
        }}
      >
        <span
          className="ap-display"
          style={{
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--ap-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Mayo
        </span>
        <span
          className="ap-mono"
          style={{
            fontSize: 8,
            color: "var(--ap-stamp)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          12 programados
        </span>
      </div>

      {/* Weekday header */}
      <div
        className="grid grid-cols-7 gap-0"
        style={{
          marginBottom: 4,
        }}
      >
        {weekdays.map((d) => (
          <div
            key={d}
            className="ap-mono"
            style={{
              fontSize: 7,
              color: "var(--ap-ink-4)",
              textAlign: "center",
              letterSpacing: "0.16em",
              padding: "2px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid — 4 weeks */}
      <div
        className="grid grid-cols-7 gap-0"
        style={{
          borderTop: "1px solid var(--ap-line)",
          borderLeft: "1px solid var(--ap-line)",
        }}
      >
        {Array.from({ length: totalCells }).map((_, i) => {
          const dayNum = i - offset + 1;
          const isCurrentMonth = dayNum >= 1 && dayNum <= 26;
          const isScheduled = isCurrentMonth && scheduled.has(dayNum);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.02 * i,
                duration: 0.3,
              }}
              style={{
                aspectRatio: "1.2 / 1",
                position: "relative",
                borderRight: "1px solid var(--ap-line)",
                borderBottom: "1px solid var(--ap-line)",
                padding: "2px 3px",
                background: isScheduled ? "rgba(229,75,38,0.06)" : "transparent",
              }}
            >
              {isCurrentMonth && (
                <span
                  className="ap-mono"
                  style={{
                    fontSize: 7,
                    color: isScheduled ? "var(--ap-stamp)" : "var(--ap-ink-3)",
                    fontWeight: isScheduled ? 600 : 400,
                    letterSpacing: "0.04em",
                  }}
                >
                  {dayNum}
                </span>
              )}
              {isScheduled && (
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.6 + (dayNum * 0.04),
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 4,
                    height: 4,
                    background: "var(--ap-stamp)",
                    borderRadius: "50%",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
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
