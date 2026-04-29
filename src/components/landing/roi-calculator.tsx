"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MotionReveal, MotionCounter, EASE_CINEMATIC } from "@/components/motion";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { RichText } from "@/components/editorial/RichText";

export function ROICalculator() {
  const [posts, setPosts] = useState(30);

  const traditionalMin = posts * 5;
  const autopostMin = 2;
  const savedMin = traditionalMin - autopostMin;
  const savedHours = savedMin / 60;
  const savedDays = savedMin / 60 / 8;
  const sliderPercent = ((posts - 5) / (120 - 5)) * 100;

  return (
    <MagazineSection
      index="06"
      kicker="CALCULADORA DE TIEMPO"
      title={
        <>
          ¿Cuánto tiempo <RichText text="<wave>ahorras al mes?</wave>" />
        </>
      }
      align="center"
    >
      <div className="max-w-2xl mx-auto relative">
        <MotionReveal cinematic>
          <div
            className="relative"
            style={{
              border: "1.5px solid var(--ap-ink)",
              background: "var(--ap-paper)",
              padding: "clamp(28px, 4vw, 48px)",
            }}
          >
            {/* Slider */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <label
                  className="ap-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ap-ink-3)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  Posts por mes
                </label>
                <motion.span
                  className="ap-display"
                  key={posts}
                  initial={{ scale: 1.2, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, ease: EASE_CINEMATIC }}
                  style={{
                    fontSize: 56,
                    fontStyle: "italic",
                    color: "var(--ap-stamp)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {posts}
                </motion.span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={posts}
                onChange={(e) => setPosts(Number(e.target.value))}
                className="ap-roi-slider w-full appearance-none cursor-pointer"
                style={{
                  height: 4,
                  background: `linear-gradient(to right, var(--ap-ink) ${sliderPercent}%, var(--ap-line-2) ${sliderPercent}%)`,
                  border: "none",
                }}
              />
              <div
                className="ap-mono flex justify-between"
                style={{
                  fontSize: 10,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.1em",
                  marginTop: 10,
                  textTransform: "uppercase",
                }}
              >
                <span>5</span>
                <span>120</span>
              </div>
            </div>

            {/* Comparison — dos paneles hairline-top */}
            <div className="grid grid-cols-2 gap-0 mb-10">
              <div
                style={{
                  borderTop: "1px solid var(--ap-line)",
                  padding: "20px 0",
                  textAlign: "center",
                  borderRight: "1px solid var(--ap-line)",
                }}
              >
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-ink-4)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  Forma tradicional
                </p>
                <p
                  className="ap-display"
                  style={{
                    fontSize: 36,
                    fontStyle: "italic",
                    color: "var(--ap-ink-4)",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  <s
                    style={{
                      textDecorationColor: "var(--ap-stamp)",
                      textDecorationThickness: "2px",
                    }}
                  >
                    <MotionCounter value={traditionalMin / 60} suffix="h" decimals={1} />
                  </s>
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--ap-ink-4)",
                    margin: "8px 0 0",
                  }}
                >
                  ≈ 5 min × {posts} posts
                </p>
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--ap-line)",
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                <p
                  className="ap-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ap-stamp)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    margin: "0 0 12px",
                  }}
                >
                  Con AutoPost
                </p>
                <p
                  className="ap-display"
                  style={{
                    fontSize: 36,
                    fontStyle: "italic",
                    color: "var(--ap-stamp)",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  2 min
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--ap-ink-4)",
                    margin: "8px 0 0",
                  }}
                >
                  para todo el lote
                </p>
              </div>
            </div>

            {/* Result */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: EASE_CINEMATIC }}
              className="text-center"
              style={{
                borderTop: "1px solid var(--ap-rule)",
                borderBottom: "1px solid var(--ap-rule)",
                padding: "28px 0 32px",
              }}
            >
              <p
                className="ap-mono"
                style={{
                  fontSize: 10,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  margin: "0 0 14px",
                }}
              >
                Ahorras al mes
              </p>
              <p
                className="ap-display"
                style={{
                  fontSize: "clamp(64px, 10vw, 96px)",
                  fontStyle: "italic",
                  color: "var(--ap-stamp)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                <MotionCounter value={savedHours} suffix="h" decimals={1} />
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ap-ink-3)",
                  fontStyle: "italic",
                  margin: "14px 0 0",
                }}
              >
                ≈ {savedDays.toFixed(1)} días de trabajo al mes
              </p>
            </motion.div>
          </div>
        </MotionReveal>
      </div>
    </MagazineSection>
  );
}
