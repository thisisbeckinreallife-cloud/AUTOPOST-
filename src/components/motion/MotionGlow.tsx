"use client";

import { motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { useCallback, type ReactNode } from "react";

interface MotionGlowProps {
  children: ReactNode;
  className?: string;
  /** Glow color in rgba format */
  color?: string;
  /** Glow radius in px */
  radius?: number;
  /** Glow intensity (0-1) */
  intensity?: number;
}

/** Card/container that shows a radial glow following the mouse */
export function MotionGlow({
  children,
  className,
  color = "rgba(255,170,0,0.08)",
  radius = 400,
  intensity = 1,
}: MotionGlowProps) {
  const prefersReducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const background = useTransform(
    [mouseX, mouseY] as any,
    ([x, y]: number[]) =>
      `radial-gradient(${radius}px circle at ${x * 100}% ${y * 100}%, ${color}, transparent 70%)`
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY, prefersReducedMotion]
  );

  return (
    <div className={`relative ${className ?? ""}`} onMouseMove={handleMouseMove}>
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background, opacity: intensity }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
