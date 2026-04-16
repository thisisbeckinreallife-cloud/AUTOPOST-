"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { SPRING_MAGNETIC } from "./constants";

interface MotionMagneticProps {
  children: ReactNode;
  /** Strength of magnetic pull (0-1). Default 0.15 */
  strength?: number;
  className?: string;
  /** Apply scale on hover */
  scale?: boolean;
}

export function MotionMagnetic({
  children,
  strength = 0.15,
  className,
  scale = false,
}: MotionMagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING_MAGNETIC);
  const springY = useSpring(y, SPRING_MAGNETIC);

  const handleMouse = (e: React.MouseEvent) => {
    if (prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={className}
      whileHover={scale ? { scale: 1.05 } : undefined}
      transition={scale ? { type: "spring", stiffness: 300, damping: 20 } : undefined}
    >
      {children}
    </motion.div>
  );
}
