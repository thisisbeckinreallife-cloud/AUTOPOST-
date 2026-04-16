"use client";

import { motion, type Variant, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";
import { EASE_OUT_EXPO, EASE_CINEMATIC, DURATION } from "./constants";

type Direction = "up" | "down" | "left" | "right" | "none";

interface MotionRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  blur?: boolean;
  scale?: boolean;
  rotate?: boolean;
  className?: string;
  once?: boolean;
  amount?: number;
  /** Use cinematic easing for dramatic reveals */
  cinematic?: boolean;
}

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up:    { y: 60 },
  down:  { y: -40 },
  left:  { x: -60 },
  right: { x: 60 },
  none:  {},
};

export function MotionReveal({
  children,
  direction = "up",
  delay = 0,
  duration = DURATION.slow,
  blur = true,
  scale = false,
  rotate = false,
  className,
  once = true,
  amount = 0.15,
  cinematic = false,
}: MotionRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset = offsets[direction];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const hidden: Variant = {
    opacity: 0,
    ...offset,
    ...(blur ? { filter: "blur(8px)" } : {}),
    ...(scale ? { scale: 0.92 } : {}),
    ...(rotate ? { rotateX: 15 } : {}),
  };

  const visible: Variant = {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    rotateX: 0,
    transition: {
      duration: cinematic ? DURATION.cinematic : duration,
      ease: cinematic ? EASE_CINEMATIC : EASE_OUT_EXPO,
      delay,
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{ hidden, visible }}
      className={className}
      style={rotate ? { perspective: 1200 } : undefined}
    >
      {children}
    </motion.div>
  );
}
