"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface MotionParallaxProps {
  children: ReactNode;
  /** Speed multiplier. 0.3 = subtle, 0.5 = moderate, 1 = full parallax */
  speed?: number;
  className?: string;
  /** Direction of parallax movement */
  direction?: "vertical" | "horizontal";
}

export function MotionParallax({
  children,
  speed = 0.3,
  className,
  direction = "vertical",
}: MotionParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const range = 100 * speed;

  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const x = useTransform(scrollYProgress, [0, 1], [range, -range]);

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div
        style={direction === "vertical" ? { y } : { x }}
      >
        {children}
      </motion.div>
    </div>
  );
}
