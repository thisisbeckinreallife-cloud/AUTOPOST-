"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface MeteorsProps {
  /** Number of meteors */
  count?: number;
  className?: string;
  /** Color of meteor trails */
  color?: string;
}

/** Animated meteor shower effect — rains diagonal streaks across a container */
export function Meteors({ count = 12, className = "", color = "#FFAA00" }: MeteorsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [meteors, setMeteors] = useState<{ id: number; left: number; delay: number; duration: number; size: number }[]>([]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    setMeteors(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 1.5 + Math.random() * 3,
        size: 80 + Math.random() * 120,
      }))
    );
  }, [count, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="absolute animate-meteor"
          style={{
            left: `${meteor.left}%`,
            top: "-5%",
            width: `${meteor.size}px`,
            height: "1px",
            background: `linear-gradient(90deg, ${color}, transparent)`,
            transform: "rotate(215deg)",
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
            boxShadow: `0 0 2px ${color}, 0 0 6px ${color}80`,
            borderRadius: "999px",
          }}
        >
          {/* Head glow */}
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[4px] rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 6px 2px ${color}, 0 0 16px 4px ${color}60`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
