"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { MotionReveal, MotionCounter, EASE_CINEMATIC, SPRING_SNAPPY } from "@/components/motion";

export function ROICalculator() {
  const [posts, setPosts] = useState(30);

  const traditionalMin = posts * 5;
  const autopostMin = 2;
  const savedMin = traditionalMin - autopostMin;
  const savedHours = savedMin / 60;
  const savedDays = savedMin / 60 / 8;

  return (
    <section className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-2xl mx-auto relative">
        <MotionReveal cinematic scale>
          <div className="rounded-2xl border border-brand-500/20 bg-surface-card p-8 sm:p-10 card-glow-hover group relative overflow-hidden">
            {/* Border beam effect (inspired by Magic UI) */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-20 h-20 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(255,170,0,0.4), transparent 70%)",
                  filter: "blur(15px)",
                }}
                animate={{
                  top: ["0%", "0%", "100%", "100%", "0%"],
                  left: ["0%", "100%", "100%", "0%", "0%"],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8 relative">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-3">
                Calculadora de tiempo
              </p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white">
                ¿Cuanto tiempo{" "}
                <span className="text-shimmer">ahorras al mes?</span>
              </h2>
            </div>

            {/* Slider */}
            <div className="mb-8 relative">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-zinc-300">
                  Posts por mes
                </label>
                <motion.span
                  className="font-display font-bold text-2xl text-brand-300 tabular-nums"
                  key={posts}
                  initial={{ scale: 1.3, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={SPRING_SNAPPY}
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
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #FFAA00 ${((posts - 5) / (120 - 5)) * 100}%, #1E2230 ${((posts - 5) / (120 - 5)) * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-zinc-600">
                <span>5 posts</span>
                <span>120 posts</span>
              </div>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div
                className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4 text-center"
                whileHover={{ scale: 1.02, borderColor: "rgba(239,68,68,0.25)" }}
                transition={{ duration: 0.3 }}
              >
                <Clock className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 mb-1">Forma tradicional</p>
                <p className="font-display font-bold text-xl text-red-300 tabular-nums">
                  <MotionCounter value={traditionalMin / 60} suffix="h" decimals={1} />
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  ~5 min x {posts} posts
                </p>
              </motion.div>
              <motion.div
                className="rounded-xl border border-brand-500/20 bg-brand-500/[0.05] p-4 text-center"
                whileHover={{ scale: 1.02, borderColor: "rgba(255,170,0,0.3)" }}
                transition={{ duration: 0.3 }}
              >
                <Zap className="h-5 w-5 text-brand-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 mb-1">Con AutoPost</p>
                <p className="font-display font-bold text-xl text-brand-300 tabular-nums">
                  2 min
                </p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  para todo el lote
                </p>
              </motion.div>
            </div>

            {/* Result with animated gradient border */}
            <motion.div
              className="rounded-xl border border-brand-500/25 bg-gradient-to-r from-brand-500/[0.08] to-accent-orange/[0.05] p-5 text-center relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: EASE_CINEMATIC }}
            >
              <p className="text-sm text-zinc-400 mb-1">Con {posts} posts al mes ahorras</p>
              <p className="font-display font-extrabold text-4xl text-gradient tabular-nums">
                <MotionCounter value={savedHours} suffix="h" decimals={1} />
              </p>
              <p className="text-sm text-zinc-500 mt-1">
                ≈ {savedDays.toFixed(1)} dias de trabajo al mes
              </p>
            </motion.div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
