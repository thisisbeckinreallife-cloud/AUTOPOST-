"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { EASE_OUT_EXPO, EASE_CINEMATIC, DURATION, STAGGER } from "./constants";

interface MotionStaggerProps {
  children: ReactNode;
  stagger?: number;
  duration?: number;
  delay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

export function MotionStagger({
  children,
  stagger = STAGGER.normal,
  duration = DURATION.normal,
  delay = 0,
  className,
  once = true,
  amount = 0.1,
}: MotionStaggerProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Child item for MotionStagger */
export function MotionStaggerItem({
  children,
  className,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const offset =
    direction === "up"    ? { y: 40 } :
    direction === "down"  ? { y: -30 } :
    direction === "left"  ? { x: -40 } :
                            { x: 40 };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, filter: "blur(6px)", ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: DURATION.slow,
            ease: EASE_CINEMATIC,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
