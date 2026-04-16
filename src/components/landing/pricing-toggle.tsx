"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SPRING_SNAPPY, SPRING_BOUNCE } from "@/components/motion";

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: () => void;
}

export function PricingToggle({ isAnnual, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <span className={`text-sm font-medium transition-colors duration-300 ${!isAnnual ? "text-white" : "text-zinc-500"}`}>
        Mensual
      </span>
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full bg-surface-card border border-white/[0.08] transition-colors hover:border-white/[0.12] active:scale-95"
        aria-label="Toggle billing period"
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-indigo shadow-glow-sm"
          animate={{ x: isAnnual ? 28 : 0 }}
          transition={SPRING_SNAPPY}
        />
        {/* Glow effect behind the toggle */}
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            boxShadow: isAnnual
              ? "0 0 20px rgba(255,170,0,0.15)"
              : "0 0 0 rgba(255,170,0,0)",
          }}
          transition={{ duration: 0.3 }}
        />
      </button>
      <span className={`text-sm font-medium transition-colors duration-300 ${isAnnual ? "text-white" : "text-zinc-500"}`}>
        Anual
      </span>
      <AnimatePresence>
        {isAnnual && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: -10 }}
            transition={SPRING_BOUNCE}
            className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/20"
          >
            -20%
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
