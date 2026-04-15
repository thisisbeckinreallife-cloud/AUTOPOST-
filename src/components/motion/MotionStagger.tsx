"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { EASE_OUT_EXPO, DURATION, STAGGER } from "./constants";

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
  amount = 0.15,
}: MotionStaggerProps) {
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

/** Child item for MotionStagger — wraps each child */
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
    direction === "up"    ? { y: 30 } :
    direction === "down"  ? { y: -20 } :
    direction === "left"  ? { x: -30 } :
                            { x: 30 };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, filter: "blur(4px)", ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: DURATION.normal,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
