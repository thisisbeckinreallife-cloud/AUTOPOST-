"use client";

import { useState } from "react";
import { Clock, Zap } from "lucide-react";

export function ROICalculator() {
  const [posts, setPosts] = useState(30);

  // Traditional: ~5 min per post (manual upload + caption copy-paste + scheduling)
  // AutoPost: 2 min flat for the whole batch
  const traditionalMin = posts * 5;
  const autopostMin = 2;
  const savedMin = traditionalMin - autopostMin;
  const savedHours = (savedMin / 60).toFixed(1);
  const savedDays = (savedMin / 60 / 8).toFixed(1);

  return (
    <section className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-2xl mx-auto relative">
        <div className="rounded-2xl border border-brand-500/20 bg-surface-card p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-[0.2em] mb-3">
              Calculadora de tiempo
            </p>
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white">
              ¿Cuánto tiempo{" "}
              <span className="text-gradient">ahorras al mes?</span>
            </h2>
          </div>

          {/* Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-zinc-300">
                Posts por mes
              </label>
              <span className="font-display font-bold text-2xl text-brand-300 tabular-nums">
                {posts}
              </span>
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
                background: `linear-gradient(to right, #7C3AED ${((posts - 5) / (120 - 5)) * 100}%, #232338 ${((posts - 5) / (120 - 5)) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-zinc-600">
              <span>5 posts</span>
              <span>120 posts</span>
            </div>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4 text-center">
              <Clock className="h-5 w-5 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 mb-1">Forma tradicional</p>
              <p className="font-display font-bold text-xl text-red-300 tabular-nums">
                {(traditionalMin / 60).toFixed(1)}h
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                ~5 min × {posts} posts
              </p>
            </div>
            <div className="rounded-xl border border-brand-500/20 bg-brand-500/[0.05] p-4 text-center">
              <Zap className="h-5 w-5 text-brand-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 mb-1">Con AutoPost</p>
              <p className="font-display font-bold text-xl text-brand-300 tabular-nums">
                2 min
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                para todo el lote
              </p>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-xl border border-brand-500/25 bg-gradient-to-r from-brand-500/[0.08] to-accent-rose/[0.05] p-5 text-center">
            <p className="text-sm text-zinc-400 mb-1">Con {posts} posts al mes ahorras</p>
            <p className="font-display font-extrabold text-4xl text-gradient tabular-nums">
              {savedHours}h
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              ≈ {savedDays} días de trabajo al mes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
