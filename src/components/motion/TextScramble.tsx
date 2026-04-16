"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useReducedMotion, useInView } from "framer-motion";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

interface TextScrambleProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  /** Speed of reveal per character in ms */
  speed?: number;
  /** Delay before starting in ms */
  delay?: number;
  /** How many random iterations per character before resolving */
  iterations?: number;
  /** Trigger on scroll into view (default) or on mount */
  trigger?: "inView" | "mount";
  /** Highlight specific words with a className after reveal */
  highlight?: { words: string[]; className: string };
  /** Color of scrambling characters */
  scrambleColor?: string;
  once?: boolean;
}

export function TextScramble({
  children,
  className,
  as: Tag = "h2",
  speed = 35,
  delay = 0,
  iterations = 6,
  trigger = "inView",
  highlight,
  scrambleColor = "var(--brand-500)",
  once = true,
}: TextScrambleProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount: 0.3 });
  const [displayText, setDisplayText] = useState<{ char: string; resolved: boolean }[]>([]);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const targetText = children;

  // Initialize with random characters
  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayText(targetText.split("").map((c) => ({ char: c, resolved: true })));
      setComplete(true);
      return;
    }
    setDisplayText(
      targetText.split("").map((c) =>
        c === " " ? { char: " ", resolved: true } : { char: CHARS[Math.floor(Math.random() * CHARS.length)], resolved: false }
      )
    );
  }, [targetText, prefersReducedMotion]);

  // Trigger scramble
  useEffect(() => {
    if (prefersReducedMotion) return;
    const shouldStart = trigger === "mount" ? true : isInView;
    if (shouldStart && !started) {
      const timer = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, trigger, started, delay, prefersReducedMotion]);

  // Run the scramble animation
  useEffect(() => {
    if (!started || prefersReducedMotion || complete) return;

    let charIndex = 0;
    let iterationCount = 0;
    const totalChars = targetText.length;

    const interval = setInterval(() => {
      setDisplayText((prev) => {
        const next = [...prev];

        // Scramble all unresolved characters
        for (let i = charIndex; i < totalChars; i++) {
          if (targetText[i] === " ") continue;
          if (!next[i]?.resolved) {
            next[i] = {
              char: CHARS[Math.floor(Math.random() * CHARS.length)],
              resolved: false,
            };
          }
        }

        // Resolve current character after enough iterations
        iterationCount++;
        if (iterationCount >= iterations) {
          if (charIndex < totalChars) {
            // Skip spaces
            while (charIndex < totalChars && targetText[charIndex] === " ") {
              charIndex++;
            }
            if (charIndex < totalChars) {
              next[charIndex] = { char: targetText[charIndex], resolved: true };
              charIndex++;
            }
            iterationCount = 0;
          }
        }

        // Check if all resolved
        if (charIndex >= totalChars) {
          setComplete(true);
          clearInterval(interval);
          return next.map((item, i) => ({ char: targetText[i], resolved: true }));
        }

        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [started, targetText, speed, iterations, prefersReducedMotion, complete]);

  // Build highlighted text after completion
  const renderText = useCallback(() => {
    if (complete && highlight) {
      const text = targetText;
      const words = text.split(" ");
      return words.map((word, i) => {
        const isHighlight = highlight.words.some((hw) =>
          word.toLowerCase().includes(hw.toLowerCase())
        );
        return (
          <span key={`${word}-${i}`}>
            <span className={isHighlight ? highlight.className : ""}>{word}</span>
            {i < words.length - 1 && " "}
          </span>
        );
      });
    }

    return displayText.map((item, i) => (
      <span
        key={i}
        style={{
          color: item.resolved ? undefined : scrambleColor,
          opacity: item.resolved ? 1 : 0.7,
          transition: item.resolved ? "color 0.15s ease" : undefined,
          fontFamily: item.resolved ? undefined : "monospace",
        }}
      >
        {item.char}
      </span>
    ));
  }, [displayText, complete, highlight, targetText, scrambleColor]);

  return (
    <Tag ref={ref as any} className={className}>
      {renderText()}
      {!complete && !prefersReducedMotion && (
        <motion.span
          className="inline-block w-[2px] h-[1em] ml-1 align-middle"
          style={{ backgroundColor: scrambleColor }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </Tag>
  );
}
