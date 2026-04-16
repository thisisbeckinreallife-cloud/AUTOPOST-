"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

interface GlowingStarsProps {
  children: React.ReactNode;
  className?: string;
  /** Number of stars */
  count?: number;
  /** Star color */
  color?: string;
  /** Enable mouse interaction — stars near cursor glow brighter */
  interactive?: boolean;
}

/** Card wrapper that spawns twinkling stars inside */
export function GlowingStars({
  children,
  className = "",
  count = 30,
  color = "#FFAA00",
  interactive = true,
}: GlowingStarsProps) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [mousePos, setMousePos] = useState({ x: -1, y: -1 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const generated: Star[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }));
    setStars(generated);
  }, [count, prefersReducedMotion]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [interactive]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1, y: -1 });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Stars layer */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {stars.map((star) => {
            const dist =
              mousePos.x >= 0
                ? Math.sqrt(Math.pow(star.x - mousePos.x, 2) + Math.pow(star.y - mousePos.y, 2))
                : 999;
            const proximity = Math.max(0, 1 - dist / 25);

            return (
              <motion.div
                key={star.id}
                className="absolute rounded-full"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size + proximity * 3,
                  height: star.size + proximity * 3,
                  backgroundColor: color,
                  boxShadow: proximity > 0.2
                    ? `0 0 ${6 + proximity * 12}px ${color}, 0 0 ${20 + proximity * 20}px ${color}40`
                    : `0 0 ${star.size * 2}px ${color}60`,
                }}
                animate={{
                  opacity: [0.2, 0.8 + proximity * 0.2, 0.2],
                  scale: [1, 1.2 + proximity * 0.5, 1],
                }}
                transition={{
                  duration: star.duration,
                  delay: star.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}

          {/* Mouse proximity glow halo */}
          {interactive && mousePos.x >= 0 && (
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${mousePos.x}%`,
                top: `${mousePos.y}%`,
                width: 120,
                height: 120,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${color}15, transparent 70%)`,
              }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
