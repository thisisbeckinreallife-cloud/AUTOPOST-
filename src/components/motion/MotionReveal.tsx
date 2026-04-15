"use client";

import { motion, type Variant } from "framer-motion";
import { type ReactNode } from "react";
import { EASE_OUT_EXPO, DURATION } from "./constants";

type Direction = "up" | "down" | "left" | "right" | "none";

interface MotionRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  blur?: boolean;
  className?: string;
  once?: boolean;
  amount?: number;
}

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up:    { y: 40 },
  down:  { y: -30 },
  left:  { x: -40 },
  right: { x: 40 },
  none:  {},
};

export function MotionReveal({
  children,
  direction = "up",
  delay = 0,
  duration = DURATION.normal,
  blur = true,
  className,
  once = true,
  amount = 0.2,
}: MotionRevealProps) {
  const offset = offsets[direction];

  const hidden: Variant = {
    opacity: 0,
    ...offset,
    ...(blur ? { filter: "blur(4px)" } : {}),
  };

  const visible: Variant = {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration,
      ease: [0.16, 1, 0.3, 1],
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
    >
      {children}
    </motion.div>
  );
}
