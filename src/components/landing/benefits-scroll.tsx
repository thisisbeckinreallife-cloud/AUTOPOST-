"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Layers,
  Calendar,
  Zap,
  Clock,
  Shield,
  Users,
  Instagram,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { RichText } from "@/components/editorial/RichText";

const benefits = [
  {
    icon: Upload,
    title: "Arrastra y listo",
    desc: "Sube una carpeta o ZIP. Fotos, vídeos, textos — AutoPost lo organiza todo automáticamente.",
    highlight: false,
  },
  {
    icon: Layers,
    title: "Carruseles inteligentes",
    desc: "Detecta patrones y agrupa tus fotos en carruseles sin que numeres nada.",
    highlight: false,
  },
  {
    icon: Calendar,
    title: "30 días programados",
    desc: "Un mes completo de contenido listo en 2 minutos. Elige horario y olvida.",
    highlight: false,
  },
  {
    icon: Users,
    title: "Posts colaborativos",
    desc: "Aparece en dos feeds a la vez. Doble audiencia con un solo post.",
    highlight: true,
  },
  {
    icon: Shield,
    title: "API oficial de Meta",
    desc: "Conexión OAuth oficial. Tu contraseña nunca se comparte ni se almacena.",
    highlight: false,
  },
  {
    icon: Clock,
    title: "90× más rápido",
    desc: "Lo que antes tomaba 2-3 horas ahora toma 2 minutos por cliente.",
    highlight: false,
  },
];

export function BenefitsScroll() {
  return (
    <section
      className="ap-root relative overflow-hidden"
      style={{ background: "var(--ap-paper)" }}
    >
      <ContainerScroll
        titleComponent={
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <p
              className="ap-mono"
              style={{
                fontSize: 11,
                color: "var(--ap-ink-4)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                margin: "0 0 18px",
              }}
            >
              05 · POR QUÉ AUTOPOST
            </p>
            <h2
              className="ap-display"
              style={{
                fontSize: "clamp(36px, 5.5vw, 80px)",
                fontStyle: "italic",
                color: "var(--ap-ink)",
                letterSpacing: "-0.02em",
                lineHeight: 0.95,
                margin: 0,
                maxWidth: 920,
                marginInline: "auto",
              }}
            >
              Todo lo que necesitas para{" "}
              <RichText text="<wave>automatizar Instagram</wave>" />
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "var(--ap-ink-3)",
                lineHeight: 1.55,
                margin: "20px auto 0",
                maxWidth: 560,
              }}
            >
              De carpeta de archivos a un mes de contenido programado. Sin
              esfuerzo, sin errores, sin perder horas.
            </p>
          </div>
        }
      >
        {/* Benefits grid */}
        <div
          className="h-full w-full overflow-y-auto"
          style={{ padding: "clamp(16px, 3vw, 32px)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.07,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    border: benefit.highlight
                      ? "1.5px solid var(--ap-ink)"
                      : "1px solid var(--ap-line)",
                    background: benefit.highlight
                      ? "rgba(212,166,39,0.08)"
                      : "var(--ap-paper-2)",
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: "1px solid var(--ap-ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      strokeWidth={1.5}
                      className="h-5 w-5"
                      style={{
                        color: benefit.highlight
                          ? "var(--ap-stamp)"
                          : "var(--ap-ink)",
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <h3
                    className="ap-display"
                    style={{
                      fontSize: 16,
                      fontStyle: "italic",
                      color: "var(--ap-ink)",
                      letterSpacing: "-0.01em",
                      margin: 0,
                    }}
                  >
                    {benefit.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--ap-ink-3)",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {benefit.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Trust strip — hairline footer */}
          <div
            className="flex flex-wrap items-center justify-center gap-8 mt-6 pt-5"
            style={{ borderTop: "1px solid var(--ap-line)" }}
          >
            {[
              { icon: Instagram, text: "JPG, PNG, WEBP, MP4, MOV" },
              { icon: Shield, text: "Cifrado AES-256" },
              { icon: Zap, text: "Publicación vía API oficial" },
            ].map(({ icon: TrustIcon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2"
                style={{
                  fontSize: 11,
                  color: "var(--ap-ink-4)",
                  fontFamily: "var(--ap-font-mono)",
                  letterSpacing: "0.06em",
                }}
              >
                <TrustIcon
                  strokeWidth={1.5}
                  className="h-3.5 w-3.5"
                  style={{ color: "var(--ap-ink-3)" }}
                  aria-hidden="true"
                />
                {text}
              </div>
            ))}
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}
