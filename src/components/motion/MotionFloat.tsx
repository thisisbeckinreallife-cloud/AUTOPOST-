"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

interface MotionFloatProps {
  children: ReactNode;
  className?: string;
  /** Float distance in px */
  distance?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Delay before starting */
  delay?: number;
  /** Add subtle rotation to the float */
  rotate?: boolean;
}

/** Perpetual floating animation — great for decorative elements */
export function MotionFloat({
  children,
  className,
  distance = 12,
  duration = 6,
  delay = 0,
  rotate = false,
}: MotionFloatProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -distance, 0, distance * 0.3, 0],
        ...(rotate ? { rotate: [0, 2, 0, -1.5, 0] } : {}),
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
