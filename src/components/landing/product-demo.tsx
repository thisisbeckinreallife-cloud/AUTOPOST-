"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Layers, Calendar } from "lucide-react";
import { MotionReveal, EASE_CINEMATIC } from "@/components/motion";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { Icon } from "@/components/editorial/atoms";

const steps = [
  {
    icon: Upload,
    title: "Sube tu carpeta",
    description: "Arrastra tu ZIP o carpeta con fotos, vídeos y textos",
    visual: DemoStep1,
  },
  {
    icon: Layers,
    title: "AutoPost lo analiza",
    description: "Detecta carruseles, extrae copies y organiza todo",
    visual: DemoStep2,
  },
  {
    icon: Calendar,
    title: "30 días programados",
    description: "Tu calendario se llena automáticamente",
    visual: DemoStep3,
  },
];

export function ProductDemo() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <MagazineSection
      index="04"
      kicker="DEMO EN VIVO"
      title={
        <>
          Mira <i>cómo funciona</i> en tiempo real.
        </>
      }
    >
      <MotionReveal delay={0.1}>
        <div
          className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Step selector */}
          <div className="flex flex-row lg:flex-col gap-0">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isActive = active === i;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="relative flex items-start gap-3 text-left transition-opacity w-full hover:opacity-80"
                  style={{
                    padding: "16px 18px",
                    background: isActive ? "var(--ap-paper-2)" : "transparent",
                    borderLeft: isActive
                      ? "3px solid var(--ap-stamp)"
                      : "3px solid transparent",
                    borderTop: i === 0 ? "1px solid var(--ap-line)" : "none",
                    borderBottom: "1px solid var(--ap-line)",
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      border: "1px solid var(--ap-ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isActive ? "var(--ap-stamp)" : "var(--ap-ink)",
                    }}
                  >
                    <StepIcon strokeWidth={1.5} className="h-4 w-4" />
                  </div>
                  <div className="hidden lg:block">
                    <p
                      className="ap-mono"
                      style={{
                        fontSize: 10,
                        color: isActive ? "var(--ap-stamp)" : "var(--ap-ink-4)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        margin: "0 0 4px",
                      }}
                    >
                      Paso 0{i + 1}
                    </p>
                    <p
                      className="ap-display"
                      style={{
                        fontSize: 16,
                        fontStyle: "italic",
                        color: "var(--ap-ink)",
                        letterSpacing: "-0.01em",
                        margin: 0,
                      }}
                    >
                      {step.title}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--ap-ink-3)",
                        margin: "4px 0 0",
                        lineHeight: 1.4,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                  {isActive && !isPaused && (
                    <motion.div
                      style={{
                        position: "absolute",
                        bottom: -1,
                        left: 0,
                        height: 2,
                        background: "var(--ap-stamp)",
                      }}
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                      key={`progress-${i}-${active}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Demo visual */}
          <div
            className="relative overflow-hidden"
            style={{
              border: "1.5px solid var(--ap-ink)",
              background: "var(--ap-paper)",
              minHeight: 400,
            }}
          >
            {/* Browser chrome editorial */}
            <div
              className="flex items-center gap-2"
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--ap-line)",
                background: "var(--ap-paper-2)",
              }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      border: "1px solid var(--ap-ink)",
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 text-center">
                <span
                  className="ap-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.06em",
                  }}
                >
                  app.autopost.io
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="relative" style={{ padding: 24, minHeight: 350 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: EASE_CINEMATIC }}
                  className="absolute"
                  style={{ inset: 24 }}
                >
                  {steps[active].visual()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </MotionReveal>
    </MagazineSection>
  );
}

function DemoStep1() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <motion.div
        className="w-full max-w-md text-center relative overflow-hidden"
        style={{
          padding: 48,
          border: "2px dashed var(--ap-ink-4)",
        }}
        animate={{
          borderColor: [
            "var(--ap-ink-4)",
            "var(--ap-stamp)",
            "var(--ap-ink-4)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        >
          <Upload
            strokeWidth={1.5}
            className="h-10 w-10 mx-auto mb-4"
            style={{ color: "var(--ap-ink-3)" }}
          />
        </motion.div>
        <p
          className="ap-display"
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--ap-ink)",
            margin: 0,
          }}
        >
          Arrastra tu carpeta aquí
        </p>
        <p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-ink-4)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "8px 0 0",
          }}
        >
          JPG · PNG · MP4 · MOV · TXT
        </p>
      </motion.div>
      <div className="flex gap-2 flex-wrap justify-center">
        {["foto_1.jpg", "foto_2.jpg", "copy.txt", "reel.mp4"].map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.4 + i * 0.12,
              type: "spring",
              stiffness: 200,
              damping: 18,
            }}
            className="ap-mono"
            style={{
              fontSize: 10,
              padding: "6px 10px",
              background: "var(--ap-paper-2)",
              border: "1px solid var(--ap-line-2)",
              color: "var(--ap-ink-3)",
              letterSpacing: "0.04em",
            }}
          >
            {f}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DemoStep2() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          style={{
            height: 2,
            flex: 1,
            background: "var(--ap-line-2)",
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{ height: "100%", background: "var(--ap-stamp)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
        <motion.span
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-stamp)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Analizando…
        </motion.span>
      </div>

      {[
        { type: "Carrusel", items: "4 fotos", copy: "copy_1.txt", count: 4 },
        { type: "Post único", items: "1 foto", copy: "copy_2.txt", count: 1 },
        { type: "Reel", items: "1 vídeo", copy: "copy_3.txt", count: 1 },
      ].map((post, i) => (
        <motion.div
          key={post.type}
          initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{
            delay: 0.8 + i * 0.35,
            duration: 0.6,
            ease: EASE_CINEMATIC,
          }}
          className="flex items-center gap-4"
          style={{
            padding: "12px 0",
            borderBottom: "1px solid var(--ap-line)",
          }}
        >
          <div className="flex gap-1">
            {Array.from({ length: post.count }).map((_, j) => (
              <motion.div
                key={j}
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--ap-paper-2)",
                  border: "1px solid var(--ap-line)",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 1.2 + i * 0.35 + j * 0.08,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              />
            ))}
          </div>
          <div className="flex-1">
            <p
              className="ap-display"
              style={{
                fontSize: 14,
                fontStyle: "italic",
                color: "var(--ap-ink)",
                margin: 0,
              }}
            >
              {post.type}
            </p>
            <p
              className="ap-mono"
              style={{
                fontSize: 10,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.08em",
                margin: "2px 0 0",
              }}
            >
              {post.items} · {post.copy}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 1.5 + i * 0.35,
              type: "spring",
              stiffness: 300,
              damping: 15,
            }}
          >
            <Icon name="check" size={16} c="var(--ap-stamp)" sw={1.8} />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

function DemoStep3() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const scheduledDays = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 30];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p
          className="ap-display"
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "var(--ap-ink)",
            margin: 0,
          }}
        >
          Mayo 2026
        </p>
        <motion.p
          className="ap-mono"
          style={{
            fontSize: 10,
            color: "var(--ap-stamp)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          16 posts programados
        </motion.p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div
            key={d}
            className="ap-mono"
            style={{
              fontSize: 10,
              color: "var(--ap-ink-4)",
              textAlign: "center",
              padding: "6px 0",
              letterSpacing: "0.1em",
            }}
          >
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const isScheduled = scheduledDays.includes(day);
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.03 * i,
                type: "spring",
                stiffness: 300,
                damping: 18,
              }}
              className="flex items-center justify-center"
              style={{
                aspectRatio: "1 / 1",
                fontSize: 11,
                fontFamily: isScheduled
                  ? "var(--ap-font-mono)"
                  : "var(--ap-font-sans)",
                background: isScheduled ? "var(--ap-ink)" : "transparent",
                color: isScheduled ? "var(--ap-paper)" : "var(--ap-ink-4)",
                border: isScheduled ? "none" : "1px solid var(--ap-line)",
                fontWeight: isScheduled ? 600 : 400,
              }}
            >
              {day}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
