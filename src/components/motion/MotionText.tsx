"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_CINEMATIC, EASE_BACK_OUT } from "./constants";

interface MotionTextProps {
  children: string;
  className?: string;
  stagger?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  highlight?: { words: string[]; className: string };
  /** Animation style: "slide" (default), "blur", "clip" */
  effect?: "slide" | "blur" | "clip";
}

export function MotionText({
  children,
  className,
  stagger = 0.06,
  delay = 0,
  duration = 0.7,
  once = true,
  as: Tag = "h2",
  highlight,
  effect = "slide",
}: MotionTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = children.split(" ");
  const MotionTag = motion[Tag] as typeof motion.h2;

  if (prefersReducedMotion) {
    const TagElement = Tag;
    return (
      <TagElement className={className}>
        {words.map((word, i) => {
          const isHighlight = highlight?.words.some((hw) =>
            word.toLowerCase().includes(hw.toLowerCase())
          );
          return (
            <span key={`${word}-${i}`} className={isHighlight ? highlight!.className : ""}>
              {word}{i < words.length - 1 && "\u00A0"}
            </span>
          );
        })}
      </TagElement>
    );
  }

  const wordVariants = {
    slide: {
      hidden: { opacity: 0, y: 30, rotateX: 40, filter: "blur(8px)" },
      visible: {
        opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)",
        transition: { duration, ease: EASE_CINEMATIC },
      },
    },
    blur: {
      hidden: { opacity: 0, filter: "blur(16px)", scale: 1.1 },
      visible: {
        opacity: 1, filter: "blur(0px)", scale: 1,
        transition: { duration: duration * 1.2, ease: EASE_CINEMATIC },
      },
    },
    clip: {
      hidden: { opacity: 0, y: "100%", skewY: 5 },
      visible: {
        opacity: 1, y: "0%", skewY: 0,
        transition: { duration, ease: EASE_BACK_OUT },
      },
    },
  };

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      style={effect === "slide" ? { perspective: 800 } : undefined}
    >
      {words.map((word, i) => {
        const isHighlight = highlight?.words.some((hw) =>
          word.toLowerCase().includes(hw.toLowerCase())
        );

        const inner = (
          <motion.span
            key={`${word}-${i}`}
            className={`inline-block ${isHighlight ? highlight!.className : ""}`}
            variants={wordVariants[effect]}
            style={effect === "slide" ? { transformOrigin: "bottom" } : undefined}
          >
            {word}
            {i < words.length - 1 && "\u00A0"}
          </motion.span>
        );

        // Clip effect wraps in overflow-hidden container
        if (effect === "clip") {
          return (
            <span key={`clip-${word}-${i}`} className="inline-block overflow-hidden">
              {inner}
            </span>
          );
        }

        return inner;
      })}
    </MotionTag>
  );
}
