"use client";

import { useScroll, useTransform, motion, type MotionValue } from "framer-motion";
import React, { useRef } from "react";
import { Upload, Layers, Calendar, Zap, Instagram, Users } from "lucide-react";

interface SectionProps {
  scrollYProgress: MotionValue<number>;
}

const Section1: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  return (
    <motion.section
      style={{ scale, rotate }}
      className="sticky top-0 h-screen bg-gradient-to-b from-white to-zinc-50 flex flex-col items-center justify-center text-zinc-900"
    >
      {/* Subtle grid pattern */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.p
          className="text-xs font-semibold text-brand-500 uppercase tracking-[0.25em] mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Descubre AutoPost
        </motion.p>
        <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl xl:text-7xl tracking-tight leading-[1.1] mb-6">
          Todo lo que necesitas{" "}
          <br className="hidden sm:block" />
          para{" "}
          <span className="bg-gradient-to-r from-brand-500 via-accent-orange to-accent-coral bg-clip-text text-transparent">
            automatizar
          </span>{" "}
          Instagram
        </h2>
        <p className="text-zinc-500 text-lg sm:text-xl max-w-2xl mx-auto">
          De una carpeta de archivos a un mes completo de contenido programado.
          Sin esfuerzo. Sin errores.
        </p>

        {/* Scroll indicator */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-2 text-zinc-400"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs tracking-wider uppercase">Scroll</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-brand-500">
            <path d="M10 4L10 16M10 16L5 11M10 16L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </div>
    </motion.section>
  );
};

const Section2: React.FC<SectionProps> = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const rotate = useTransform(scrollYProgress, [0, 1], [5, 0]);

  const features = [
    {
      icon: Upload,
      title: "Sube tu contenido",
      desc: "Arrastra una carpeta o ZIP con fotos, videos y textos.",
      accent: "from-brand-400 to-brand-500",
    },
    {
      icon: Layers,
      title: "Deteccion inteligente",
      desc: "Carruseles detectados automaticamente. Sin numerar nada.",
      accent: "from-accent-indigo to-accent-blue",
    },
    {
      icon: Calendar,
      title: "Programa 30 dias",
      desc: "Un mes de contenido listo en 2 minutos.",
      accent: "from-accent-orange to-accent-coral",
    },
    {
      icon: Users,
      title: "Posts colaborativos",
      desc: "Aparece en dos feeds a la vez. Doble audiencia.",
      accent: "from-accent-indigo to-accent-emerald",
    },
    {
      icon: Instagram,
      title: "Todos los formatos",
      desc: "JPG, PNG, WEBP, MP4 y MOV. Hasta 100 MB.",
      accent: "from-brand-400 to-accent-orange",
    },
    {
      icon: Zap,
      title: "API oficial de Meta",
      desc: "Conexion OAuth segura. Tu contrasena nunca se comparte.",
      accent: "from-accent-emerald to-accent-blue",
    },
  ];

  return (
    <motion.section
      style={{ scale, rotate }}
      className="relative min-h-screen bg-zinc-950 text-white py-20 px-6"
    >
      {/* Grid pattern */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.h2
          className="font-display font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.1] mb-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Disenado para hacer{" "}
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-brand-400 to-accent-orange bg-clip-text text-transparent">
            mucho en poco
          </span>
        </motion.h2>
        <motion.p
          className="text-zinc-400 text-lg mb-14 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Cada funcionalidad disenada para ahorrarte horas de trabajo manual.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 hover:bg-white/[0.06] transition-all duration-300"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} mb-4`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-base text-white mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom curve transition */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full" preserveAspectRatio="none">
          <path d="M0 80L1440 80L1440 0C1440 0 1080 60 720 60C360 60 0 0 0 0L0 80Z" fill="white" />
        </svg>
      </div>
    </motion.section>
  );
};

export default function HeroScrollAnimation() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={container} className="relative h-[200vh]">
      <Section1 scrollYProgress={scrollYProgress} />
      <Section2 scrollYProgress={scrollYProgress} />
    </div>
  );
}
