"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { EASE_CINEMATIC } from "./constants";

interface NumberTickerProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Delay before counting starts */
  delay?: number;
  /** Direction: "up" counts 0→value, "down" counts value→0 */
  direction?: "up" | "down";
  /** Trigger mode */
  trigger?: "inView" | "mount";
}

/** Slot-machine style number ticker — each digit rolls independently */
export function NumberTicker({
  value,
  className = "",
  prefix = "",
  suffix = "",
  delay = 0,
  direction = "up",
  trigger = "inView",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(direction === "up" ? 0 : value);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    const shouldStart = trigger === "mount" ? true : isInView;
    if (shouldStart && !started) {
      const timer = setTimeout(() => {
        setStarted(true);
        setDisplayValue(direction === "up" ? value : 0);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isInView, trigger, started, delay, value, direction, prefersReducedMotion]);

  const digits = String(Math.abs(value)).split("");
  const displayDigits = String(Math.abs(displayValue)).padStart(digits.length, "0").split("");

  return (
    <span ref={ref} className={`inline-flex items-baseline ${className}`}>
      {prefix && <span>{prefix}</span>}
      {displayDigits.map((digit, i) => (
        <DigitSlot key={`${i}-${digits.length}`} digit={digit} started={started} index={i} total={digits.length} />
      ))}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

function DigitSlot({ digit, started, index, total }: { digit: string; started: boolean; index: number; total: number }) {
  return (
    <span className="relative inline-block overflow-hidden" style={{ width: "0.65em", height: "1.15em" }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: started ? "100%" : "0%", opacity: started ? 0 : 1, filter: started ? "blur(4px)" : "blur(0px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
          transition={{
            duration: 0.5,
            delay: index * 0.08,
            ease: EASE_CINEMATIC,
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Animated price display with morph transition */
interface PriceMorphProps {
  value: string;
  className?: string;
}

export function PriceMorph({ value, className = "" }: PriceMorphProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <AnimatePresence mode="popLayout">
        {value.split("").map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            className="inline-block"
            initial={prefersReducedMotion ? false : { y: 24, opacity: 0, filter: "blur(6px)", scale: 0.8 }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ y: -24, opacity: 0, filter: "blur(6px)", scale: 0.8 }}
            transition={{
              duration: 0.35,
              delay: i * 0.04,
              ease: EASE_CINEMATIC,
            }}
          >
            {char}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
