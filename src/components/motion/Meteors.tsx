"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface MeteorsProps {
  /** Number of meteors */
  count?: number;
  className?: string;
  /** Primary color of meteor trails */
  color?: string;
  /** Secondary color for dual-tone trails */
  colorSecondary?: string;
  /** Meteor style variant */
  variant?: "default" | "premium" | "starfield";
}

/** Cinema-grade meteor shower — premium diagonal streaks with multi-layer glow */
export function Meteors({
  count = 12,
  className = "",
  color = "#FFAA00",
  colorSecondary,
  variant = "default",
}: MeteorsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [meteors, setMeteors] = useState<
    {
      id: number;
      left: number;
      top: number;
      delay: number;
      duration: number;
      size: number;
      thickness: number;
      opacity: number;
      angle: number;
    }[]
  >([]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const isPremium = variant === "premium" || variant === "starfield";

    setMeteors(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 120 - 10,
        top: Math.random() * 40 - 20,
        delay: Math.random() * (isPremium ? 15 : 8),
        duration: isPremium ? 3 + Math.random() * 5 : 1.5 + Math.random() * 3,
        size: isPremium ? 120 + Math.random() * 180 : 80 + Math.random() * 120,
        thickness: isPremium ? 0.5 + Math.random() * 1 : 1,
        opacity: isPremium ? 0.15 + Math.random() * 0.45 : 0.6 + Math.random() * 0.4,
        // Varied directions: mostly diagonal but spread across 180-260° range
        angle: isPremium ? 180 + Math.random() * 80 : 215,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, variant]);

  if (prefersReducedMotion) return null;

  const secondary = colorSecondary || color;

  if (variant === "starfield") {
    return <Starfield count={count} color={color} className={className} />;
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {meteors.map((meteor) => {
        const isPremium = variant === "premium";
        const trailColor = Math.random() > 0.5 ? color : secondary;

        return (
          <span
            key={meteor.id}
            className="absolute animate-meteor"
            style={{
              left: `${meteor.left}%`,
              top: `${meteor.top}%`,
              width: `${meteor.size}px`,
              height: `${meteor.thickness}px`,
              background: isPremium
                ? `linear-gradient(90deg, ${trailColor}, ${trailColor}60 30%, transparent)`
                : `linear-gradient(90deg, ${trailColor}, transparent)`,
              transform: `rotate(${meteor.angle}deg)`,
              animationDelay: `${meteor.delay}s`,
              animationDuration: `${meteor.duration}s`,
              opacity: meteor.opacity,
              boxShadow: isPremium
                ? `0 0 ${meteor.thickness * 3}px ${trailColor}, 0 0 ${meteor.thickness * 8}px ${trailColor}50, 0 0 ${meteor.thickness * 16}px ${trailColor}20`
                : `0 0 2px ${trailColor}, 0 0 6px ${trailColor}80`,
              borderRadius: "999px",
            }}
          >
            {/* Head glow — larger and multi-layered for premium */}
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: isPremium ? `${6 + meteor.thickness * 2}px` : "4px",
                height: isPremium ? `${6 + meteor.thickness * 2}px` : "4px",
                backgroundColor: "#fff",
                boxShadow: isPremium
                  ? `0 0 4px 2px #fff, 0 0 8px 3px ${trailColor}, 0 0 20px 6px ${trailColor}80, 0 0 40px 10px ${trailColor}30`
                  : `0 0 6px 2px ${trailColor}, 0 0 16px 4px ${trailColor}60`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** Premium starfield — persistent twinkling points with occasional shooting stars */
function Starfield({
  count,
  color,
  className,
}: {
  count: number;
  color: string;
  className: string;
}) {
  const [stars, setStars] = useState<
    { id: number; x: number; y: number; size: number; delay: number; duration: number; brightness: number }[]
  >([]);

  useEffect(() => {
    setStars(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 4,
        brightness: 0.3 + Math.random() * 0.7,
      }))
    );
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: star.brightness > 0.7 ? "#fff" : color,
            boxShadow:
              star.brightness > 0.6
                ? `0 0 ${star.size * 3}px ${color}, 0 0 ${star.size * 6}px ${color}40`
                : `0 0 ${star.size * 2}px ${color}60`,
          }}
          animate={{
            opacity: [star.brightness * 0.3, star.brightness, star.brightness * 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
