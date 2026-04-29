"use client";

import { motion } from "framer-motion";
import { MotionReveal, EASE_CINEMATIC } from "@/components/motion";
import { MagazineSection } from "@/components/editorial/MagazineSection";
import { Icon } from "@/components/editorial/atoms";

const features = [
  { name: "Subida masiva por carpeta/ZIP", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Detección de carruseles", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Extracción automática de copy", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Posts colaborativos (Collabs)", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "30 días en 2 minutos", autopost: true, later: false, buffer: false, hootsuite: false },
  { name: "Programación de contenido", autopost: true, later: true, buffer: true, hootsuite: true },
  { name: "Vista previa del feed", autopost: true, later: true, buffer: true, hootsuite: false },
  { name: "API oficial de Meta", autopost: true, later: true, buffer: true, hootsuite: true },
];

const Cell = ({ value, delay }: { value: boolean; delay: number }) => (
  <motion.td
    style={{ padding: "16px", textAlign: "center" }}
    initial={{ opacity: 0, scale: 0.5 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
  >
    {value ? (
      <Icon name="check" size={16} c="var(--ap-stamp)" sw={1.8} />
    ) : (
      <Icon name="x" size={16} c="var(--ap-ink-4)" sw={1.5} />
    )}
  </motion.td>
);

export function ComparisonTable() {
  return (
    <MagazineSection
      index="08"
      kicker="COMPARATIVA"
      title={
        <>
          AutoPost vs <i>la competencia</i>.
        </>
      }
    >
      <MotionReveal delay={0.1}>
        <div className="overflow-x-auto">
          <table
            style={{
              width: "100%",
              fontSize: 14,
              borderCollapse: "collapse",
              borderTop: "1.5px solid var(--ap-ink)",
              borderBottom: "1.5px solid var(--ap-ink)",
              fontFamily: "var(--ap-font-sans)",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--ap-line-2)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "16px",
                    minWidth: 200,
                    color: "var(--ap-ink-4)",
                    fontFamily: "var(--ap-font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    fontWeight: 500,
                  }}
                >
                  Funcionalidad
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    minWidth: 110,
                    background: "rgba(229,75,38,0.04)",
                    borderTop: "2px solid var(--ap-stamp)",
                  }}
                >
                  <span
                    className="ap-display"
                    style={{
                      fontStyle: "italic",
                      fontSize: 18,
                      color: "var(--ap-ink)",
                    }}
                  >
                    AutoPost
                  </span>
                </th>
                {(["Later", "Buffer", "Hootsuite"] as const).map((c) => (
                  <th
                    key={c}
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      minWidth: 100,
                      color: "var(--ap-ink-4)",
                      fontFamily: "var(--ap-font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, rowIdx) => (
                <motion.tr
                  key={f.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: rowIdx * 0.06,
                    duration: 0.5,
                    ease: EASE_CINEMATIC,
                  }}
                  style={{ borderBottom: "1px solid var(--ap-line)" }}
                >
                  <td
                    style={{
                      padding: "16px",
                      color: "var(--ap-ink-2)",
                      fontSize: 14,
                    }}
                  >
                    {f.name}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      textAlign: "center",
                      background: "rgba(229,75,38,0.04)",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: rowIdx * 0.06 + 0.2,
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      style={{ display: "flex", justifyContent: "center" }}
                    >
                      <Icon name="check" size={16} c="var(--ap-stamp)" sw={1.8} />
                    </motion.div>
                  </td>
                  <Cell value={f.later} delay={rowIdx * 0.06 + 0.25} />
                  <Cell value={f.buffer} delay={rowIdx * 0.06 + 0.3} />
                  <Cell value={f.hootsuite} delay={rowIdx * 0.06 + 0.35} />
                </motion.tr>
              ))}
              {/* Highlight bottom border for AutoPost column */}
              <tr>
                <td colSpan={5} style={{ padding: 0, border: "none" }}>
                  <div
                    style={{
                      height: 0,
                      borderBottom: "2px solid var(--ap-stamp)",
                      width: "calc((100% - 200px) / 4)",
                      marginLeft: 200,
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </MotionReveal>

      <MotionReveal delay={0.3}>
        <div className="flex justify-center items-baseline gap-12 mt-12">
          <div className="text-center">
            <p
              className="ap-display"
              style={{
                fontSize: 48,
                fontStyle: "italic",
                color: "var(--ap-ink)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              $19
              <span
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.1em",
                  marginLeft: 6,
                  fontStyle: "normal",
                }}
              >
                /MES
              </span>
            </p>
            <p
              className="ap-mono"
              style={{
                fontSize: 10,
                color: "var(--ap-stamp)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginTop: 8,
              }}
            >
              AutoPost Pro
            </p>
          </div>
          <div style={{ width: 1, height: 48, background: "var(--ap-line-2)" }} />
          <div className="text-center">
            <p
              className="ap-display"
              style={{
                fontSize: 48,
                fontStyle: "italic",
                color: "var(--ap-ink-4)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              <s style={{ textDecorationColor: "var(--ap-stamp)", textDecorationThickness: "2px" }}>
                $25-99
              </s>
              <span
                className="ap-mono"
                style={{
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  letterSpacing: "0.1em",
                  marginLeft: 6,
                  fontStyle: "normal",
                }}
              >
                /MES
              </span>
            </p>
            <p
              className="ap-mono"
              style={{
                fontSize: 10,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginTop: 8,
              }}
            >
              Competidores
            </p>
          </div>
        </div>
      </MotionReveal>
    </MagazineSection>
  );
}
