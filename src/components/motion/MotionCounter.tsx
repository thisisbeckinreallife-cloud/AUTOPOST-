"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useTransform,
  useReducedMotion,
} from "framer-motion";

interface MotionCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  once?: boolean;
}

export function MotionCounter({
  value,
  duration = 1.5,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  once = true,
}: MotionCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 40,
    damping: 25,
    duration,
  });

  const display = useTransform(spring, (latest: number) => {
    return `${prefix}${latest.toFixed(decimals)}${suffix}`;
  });

  useEffect(() => {
    if (isInView) {
      if (prefersReducedMotion) {
        motionValue.set(value);
      } else {
        // Small delay for dramatic effect
        const timer = setTimeout(() => motionValue.set(value), 200);
        return () => clearTimeout(timer);
      }
    }
  }, [isInView, value, motionValue, prefersReducedMotion]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
