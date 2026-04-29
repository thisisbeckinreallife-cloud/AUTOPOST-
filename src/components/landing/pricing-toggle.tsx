"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SNAPPY, SPRING_BOUNCE } from "@/components/motion";

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: () => void;
}

export function PricingToggle({ isAnnual, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-2">
      <span
        className="ap-mono"
        style={{
          fontSize: 11,
          color: !isAnnual ? "var(--ap-ink)" : "var(--ap-ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          transition: "color 0.3s",
        }}
      >
        Mensual
      </span>
      <button
        onClick={onToggle}
        className="relative active:scale-95 transition-transform"
        aria-label="Toggle billing period"
        style={{
          width: 56,
          height: 24,
          background: "var(--ap-paper-2)",
          border: "1px solid var(--ap-ink)",
          borderRadius: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 18,
            height: 18,
            background: "var(--ap-stamp)",
            border: "1px solid var(--ap-ink)",
          }}
          animate={{ x: isAnnual ? 30 : 0 }}
          transition={SPRING_SNAPPY}
        />
      </button>
      <span
        className="ap-mono"
        style={{
          fontSize: 11,
          color: isAnnual ? "var(--ap-ink)" : "var(--ap-ink-4)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          transition: "color 0.3s",
        }}
      >
        Anual
      </span>
      <AnimatePresence>
        {isAnnual && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5, x: -10, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0, rotate: -3 }}
            exit={{ opacity: 0, scale: 0.5, x: -10 }}
            transition={SPRING_BOUNCE}
            className="ap-stamp-chip"
          >
            -20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
