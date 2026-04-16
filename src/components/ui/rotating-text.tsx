"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RotatingTextProps {
  texts: string[];
  /** Time each word stays visible (ms) */
  interval?: number;
  className?: string;
  textClassName?: string;
  /** Animation variant */
  variant?: "slide" | "blur" | "clip" | "morph";
}

const variants = {
  slide: {
    initial: { y: "100%", opacity: 0, rotateX: -80 },
    animate: { y: "0%", opacity: 1, rotateX: 0 },
    exit: { y: "-120%", opacity: 0, rotateX: 80 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(12px)", scale: 0.9 },
    animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, filter: "blur(12px)", scale: 1.1 },
  },
  clip: {
    initial: { opacity: 0, clipPath: "inset(100% 0 0 0)" },
    animate: { opacity: 1, clipPath: "inset(0 0 0 0)" },
    exit: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  },
  morph: {
    initial: { opacity: 0, y: 30, filter: "blur(8px)", scale: 0.95 },
    animate: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 },
    exit: { opacity: 0, y: -30, filter: "blur(8px)", scale: 1.05 },
  },
};

export function RotatingText({
  texts,
  interval = 3000,
  className,
  textClassName,
  variant = "morph",
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % texts.length);
  }, [texts.length]);

  useEffect(() => {
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [next, interval]);

  const v = variants[variant];

  return (
    <span
      className={cn("relative inline-block overflow-hidden", className)}
      style={{ perspective: variant === "slide" ? 800 : undefined }}
    >
      {/* Invisible sizer — takes up space of the longest word */}
      <span className={cn("invisible", textClassName)} aria-hidden="true">
        {texts.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={texts[index]}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            textClassName
          )}
          initial={v.initial}
          animate={v.animate}
          exit={v.exit}
          transition={{
            duration: 0.5,
            ease: [0.22, 0.68, 0, 1], // EASE_CINEMATIC
          }}
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
