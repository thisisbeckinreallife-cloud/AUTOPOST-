"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { EASE_OUT_EXPO } from "./constants";

interface MotionTextProps {
  children: string;
  className?: string;
  stagger?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  /** Tag to render: h1, h2, h3, p, span */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  /** Render specific words with a custom wrapper */
  highlight?: { words: string[]; className: string };
}

export function MotionText({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  duration = 0.6,
  once = true,
  as: Tag = "h2",
  highlight,
}: MotionTextProps) {
  const words = children.split(" ");

  // We use motion[Tag] but TypeScript needs casting
  const MotionTag = motion[Tag] as typeof motion.h2;

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
    >
      {words.map((word, i) => {
        const isHighlight =
          highlight?.words.some((hw) => word.toLowerCase().includes(hw.toLowerCase()));

        return (
          <motion.span
            key={`${word}-${i}`}
            className={`inline-block ${isHighlight ? highlight!.className : ""}`}
            variants={{
              hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: {
                  duration,
                  ease: [0.16, 1, 0.3, 1],
                },
              },
            }}
          >
            {word}
            {i < words.length - 1 && "\u00A0"}
          </motion.span>
        );
      })}
    </MotionTag>
  );
}
