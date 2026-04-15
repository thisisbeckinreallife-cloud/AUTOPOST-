"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedStatProps {
  value: string;
  label: string;
  gradient: string;
}

function AnimatedStat({ value, label, gradient }: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <p
        className={cn(
          "font-display font-extrabold text-3xl sm:text-4xl bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700",
          gradient,
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export function StatsStrip() {
  return (
    <section className="relative border-y border-white/[0.04] py-12 px-6 bg-gradient-cta">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-0 text-center">
        <div className="flex-1 flex justify-center">
          <AnimatedStat
            value="2 min"
            label="para programar un mes"
            gradient="from-brand-400 to-brand-500"
          />
        </div>
        <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
        <div className="flex-1 flex justify-center">
          <AnimatedStat
            value="30 días"
            label="de contenido automatizado"
            gradient="from-violet-400 to-purple-500"
          />
        </div>
        <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
        <div className="flex-1 flex justify-center">
          <AnimatedStat
            value="0"
            label="publicaciones manuales"
            gradient="from-cyan-400 to-blue-500"
          />
        </div>
      </div>
    </section>
  );
}
