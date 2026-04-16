"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";

interface MotionParallaxProps {
  children: ReactNode;
  /** Speed multiplier. 0.2 = subtle, 0.5 = moderate, 1 = full */
  speed?: number;
  className?: string;
  direction?: "vertical" | "horizontal";
  /** Add smooth spring physics to the parallax */
  smooth?: boolean;
  /** Opacity fade based on scroll position */
  fade?: boolean;
  /** Scale effect based on scroll */
  scale?: boolean;
}

export function MotionParallax({
  children,
  speed = 0.3,
  className,
  direction = "vertical",
  smooth = true,
  fade = false,
  scale = false,
}: MotionParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const range = 100 * speed;

  const rawY = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const rawX = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const rawScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.85, 1, 1, 0.85]);

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
  const y = smooth ? useSpring(rawY, springConfig) : rawY;
  const x = smooth ? useSpring(rawX, springConfig) : rawX;

  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div
        style={{
          ...(direction === "vertical" ? { y } : { x }),
          ...(fade ? { opacity: rawOpacity } : {}),
          ...(scale ? { scale: rawScale } : {}),
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
