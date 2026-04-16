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
  CheckCircle,
  Users,
  Instagram,
  ArrowRight,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { cn } from "@/lib/utils";

const benefits = [
  {
    icon: Upload,
    title: "Arrastra y listo",
    desc: "Sube una carpeta o ZIP. Fotos, videos, textos — AutoPost lo organiza todo automaticamente.",
    accent: "brand",
  },
  {
    icon: Layers,
    title: "Carruseles inteligentes",
    desc: "Detecta patrones y agrupa tus fotos en carruseles sin que numeres nada.",
    accent: "indigo",
  },
  {
    icon: Calendar,
    title: "30 dias programados",
    desc: "Un mes completo de contenido listo en 2 minutos. Elige horario y olvida.",
    accent: "orange",
  },
  {
    icon: Users,
    title: "Posts colaborativos",
    desc: "Aparece en dos feeds a la vez. Doble audiencia con un solo post.",
    accent: "indigo",
  },
  {
    icon: Shield,
    title: "API oficial de Meta",
    desc: "Conexion OAuth oficial. Tu contrasena nunca se comparte ni se almacena.",
    accent: "emerald",
  },
  {
    icon: Clock,
    title: "90x mas rapido",
    desc: "Lo que antes tomaba 2-3 horas ahora toma 2 minutos por cliente.",
    accent: "brand",
  },
];

const accentMap: Record<string, { icon: string; bg: string; border: string; glow: string }> = {
  brand: {
    icon: "text-brand-400",
    bg: "bg-brand-500/10",
    border: "border-brand-500/20",
    glow: "shadow-[0_0_20px_rgba(255,170,0,0.08)]",
  },
  indigo: {
    icon: "text-accent-indigo",
    bg: "bg-accent-indigo/10",
    border: "border-accent-indigo/20",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.08)]",
  },
  orange: {
    icon: "text-accent-orange",
    bg: "bg-accent-orange/10",
    border: "border-accent-orange/20",
    glow: "shadow-[0_0_20px_rgba(251,146,60,0.08)]",
  },
  emerald: {
    icon: "text-accent-emerald",
    bg: "bg-accent-emerald/10",
    border: "border-accent-emerald/20",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.08)]",
  },
};

export function BenefitsScroll() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.015] to-transparent pointer-events-none" />

      <ContainerScroll
        titleComponent={
          <div className="mb-4">
            <motion.p
              className="text-xs font-semibold text-brand-400 uppercase tracking-[0.25em] mb-5"
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              whileInView={{ opacity: 1, letterSpacing: "0.25em" }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              Por que AutoPost
            </motion.p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-[3.5rem] tracking-tight text-white leading-tight">
              Todo lo que necesitas para{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-accent-indigo bg-clip-text text-transparent">
                automatizar Instagram
              </span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
              De carpeta de archivos a un mes de contenido programado.
              Sin esfuerzo, sin errores, sin perder horas.
            </p>
          </div>
        }
      >
        {/* Benefits grid inside the scroll card */}
        <div className="h-full w-full p-4 sm:p-8 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {benefits.map((benefit, i) => {
              const colors = accentMap[benefit.accent] || accentMap.brand;
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  className={cn(
                    "group relative rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300",
                    "bg-surface-primary/60 backdrop-blur-sm",
                    colors.border,
                    "hover:border-opacity-50",
                    colors.glow
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      colors.bg,
                      colors.border
                    )}
                  >
                    <Icon className={cn("h-5 w-5", colors.icon)} aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-semibold text-sm text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {benefit.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-5 border-t border-white/[0.04]">
            {[
              { icon: Instagram, text: "JPG, PNG, WEBP, MP4, MOV" },
              { icon: Shield, text: "Cifrado AES-256" },
              { icon: Zap, text: "Publicacion via API oficial" },
            ].map(({ icon: TrustIcon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-zinc-500">
                <TrustIcon className="h-3.5 w-3.5 text-brand-500/50" aria-hidden="true" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}
