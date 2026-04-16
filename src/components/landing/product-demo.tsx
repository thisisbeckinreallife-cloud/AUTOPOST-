"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Layers, Calendar, CheckCircle } from "lucide-react";
import { MotionReveal, EASE_CINEMATIC, SPRING_SNAPPY } from "@/components/motion";

const steps = [
  {
    icon: Upload,
    title: "Sube tu carpeta",
    description: "Arrastra tu ZIP o carpeta con fotos, videos y textos",
    visual: DemoStep1,
    accent: "brand",
  },
  {
    icon: Layers,
    title: "AutoPost lo analiza",
    description: "Detecta carruseles, extrae copies y organiza todo",
    visual: DemoStep2,
    accent: "indigo",
  },
  {
    icon: Calendar,
    title: "30 dias programados",
    description: "Tu calendario se llena automaticamente",
    visual: DemoStep3,
    accent: "emerald",
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
    <section className="py-28 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <MotionReveal cinematic>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-4">
              Demo en vivo
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Mira como funciona <span className="text-gradient">en tiempo real</span>
            </h2>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.2}>
          <div
            className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Step selector */}
            <div className="flex flex-row lg:flex-col gap-3">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isActive = active === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`relative flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-300 w-full ${
                      isActive
                        ? "bg-brand-500/[0.08] border border-brand-500/20"
                        : "border border-transparent hover:bg-white/[0.03] hover:border-white/[0.06]"
                    }`}
                  >
                    <motion.div
                      className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-brand-500/15 text-brand-400" : "bg-white/[0.04] text-zinc-500"
                      }`}
                      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <div className="hidden lg:block">
                      <p className={`text-sm font-semibold transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-400"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                    </div>
                    {/* Progress bar */}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-brand-500 to-brand-400 rounded-full hidden lg:block"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: isPaused ? 999 : 5, ease: "linear" }}
                        key={`progress-${i}-${active}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Demo visual */}
            <div className="relative rounded-2xl border border-white/[0.06] bg-surface-card overflow-hidden min-h-[400px] card-shine">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-surface-secondary">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-[10px] text-zinc-600 font-mono">app.autopost.io</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 relative min-h-[350px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -15, scale: 0.98, filter: "blur(4px)" }}
                    transition={{ duration: 0.5, ease: EASE_CINEMATIC }}
                    className="absolute inset-6"
                  >
                    {steps[active].visual()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

function DemoStep1() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <motion.div
        className="w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center relative overflow-hidden"
        animate={{
          borderColor: ["rgba(255,170,0,0.2)", "rgba(255,170,0,0.5)", "rgba(255,170,0,0.2)"],
          boxShadow: [
            "inset 0 0 30px rgba(255,170,0,0.02)",
            "inset 0 0 30px rgba(255,170,0,0.06)",
            "inset 0 0 30px rgba(255,170,0,0.02)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        >
          <Upload className="h-10 w-10 text-brand-400/60 mx-auto mb-4" />
        </motion.div>
        <p className="text-sm text-zinc-400">Arrastra tu carpeta aqui</p>
        <p className="text-xs text-zinc-600 mt-1">JPG, PNG, MP4, MOV, TXT</p>
      </motion.div>
      <div className="flex gap-2 flex-wrap justify-center">
        {["foto_1.jpg", "foto_2.jpg", "copy.txt", "reel.mp4"].map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.12, type: "spring", stiffness: 200, damping: 18 }}
            className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-500 font-mono"
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
        <motion.div className="h-2.5 flex-1 rounded-full bg-surface-secondary overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 via-accent-indigo to-brand-400 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
        <motion.span
          className="text-xs text-brand-400 font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Analizando...
        </motion.span>
      </div>

      {[
        { type: "Carrusel", items: "4 fotos", copy: "copy_1.txt", count: 4 },
        { type: "Post unico", items: "1 foto", copy: "copy_2.txt", count: 1 },
        { type: "Reel", items: "1 video", copy: "copy_3.txt", count: 1 },
      ].map((post, i) => (
        <motion.div
          key={post.type}
          initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.8 + i * 0.35, duration: 0.6, ease: EASE_CINEMATIC }}
          className="flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex gap-1">
            {Array.from({ length: post.count }).map((_, j) => (
              <motion.div
                key={j}
                className="w-10 h-10 rounded-lg bg-surface-tertiary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + i * 0.35 + j * 0.08, type: "spring", stiffness: 300, damping: 20 }}
              />
            ))}
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">{post.type}</p>
            <p className="text-[10px] text-zinc-500">{post.items} · {post.copy}</p>
          </div>
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 1.5 + i * 0.35, type: "spring", stiffness: 300, damping: 15 }}
          >
            <CheckCircle className="h-4 w-4 text-brand-400" />
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
        <p className="text-sm font-semibold text-white">Mayo 2026</p>
        <motion.p
          className="text-xs text-brand-400 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          16 posts programados
        </motion.p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="text-[10px] text-zinc-600 text-center py-1 font-medium">{d}</div>
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
              className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${
                isScheduled
                  ? "bg-brand-500/15 text-brand-400 border border-brand-500/20 font-semibold shadow-inner-glow"
                  : "text-zinc-600 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              {day}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
