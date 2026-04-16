"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface BorderBeamProps {
  className?: string;
  /** Size of the beam glow in px */
  size?: number;
  /** Duration of full rotation in seconds */
  duration?: number;
  /** Beam color */
  color?: string;
  /** Secondary beam color for gradient */
  colorTo?: string;
  /** Border width */
  borderWidth?: number;
  /** Delay before starting */
  delay?: number;
  children: React.ReactNode;
}

export function BorderBeam({
  className = "",
  size = 200,
  duration = 8,
  color = "#FFAA00",
  colorTo = "#6366F1",
  borderWidth = 1.5,
  delay = 0,
  children,
}: BorderBeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();

  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      {isInView && !prefersReducedMotion && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
          style={{ padding: borderWidth }}
        >
          {/* Mask to create border effect */}
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: `${borderWidth}px`,
            }}
          >
            {/* The moving beam */}
            <motion.div
              className="absolute"
              style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, ${color} 0%, ${colorTo} 40%, transparent 70%)`,
                borderRadius: "50%",
                filter: `blur(${size * 0.15}px)`,
                opacity: 0.9,
              }}
              initial={{
                top: "0%",
                left: "-10%",
                opacity: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 1, 1, 1, 1, 1, 0],
                top: ["0%", "0%", "0%", "100%", "100%", "100%", "0%", "0%", "0%"],
                left: ["-10%", "0%", "100%", "100%", "100%", "0%", "0%", "-10%", "-10%"],
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.01, 0.25, 0.26, 0.5, 0.51, 0.75, 0.99, 1],
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
