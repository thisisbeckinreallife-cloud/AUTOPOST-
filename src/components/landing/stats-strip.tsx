"use client";

import { motion } from "framer-motion";
import { MotionReveal, NumberTicker, EASE_CINEMATIC, STAGGER } from "@/components/motion";

const stats = [
  { value: 2, suffix: " min", label: "para programar un mes", gradient: "from-brand-400 to-brand-500" },
  { value: 30, suffix: " dias", label: "de contenido automatizado", gradient: "from-violet-400 to-purple-500" },
  { value: 0, suffix: "", label: "publicaciones manuales", gradient: "from-cyan-400 to-blue-500" },
];

export function StatsStrip() {
  return (
    <section className="relative border-y border-zinc-100 py-14 px-6 bg-gradient-cta overflow-hidden">
      {/* Subtle animated glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/[0.03] via-transparent to-accent-indigo/[0.03] pointer-events-none" />

      <MotionReveal>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-0 text-center">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex-1 flex justify-center"
              initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: i * STAGGER.wide,
                ease: EASE_CINEMATIC,
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <p className={`font-display font-extrabold text-4xl sm:text-5xl bg-gradient-to-r bg-clip-text text-transparent ${stat.gradient}`}>
                  {stat.value > 0 ? (
                    <NumberTicker value={stat.value} suffix={stat.suffix} delay={300 + i * 200} />
                  ) : (
                    <>0{stat.suffix}</>
                  )}
                </p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
              {i < stats.length - 1 && (
                <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
              )}
            </motion.div>
          ))}
          {/* Dividers */}
          <div className="hidden sm:flex absolute inset-0 items-center justify-center pointer-events-none">
            <div className="max-w-4xl w-full flex">
              <div className="flex-1" />
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
              <div className="flex-1" />
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
              <div className="flex-1" />
            </div>
          </div>
        </div>
      </MotionReveal>
    </section>
  );
}
