"use client";

import { motion } from "framer-motion";

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: () => void;
}

export function PricingToggle({ isAnnual, onToggle }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-white" : "text-zinc-500"}`}>
        Mensual
      </span>
      <button
        onClick={onToggle}
        className="relative w-14 h-7 rounded-full bg-surface-card border border-white/[0.08] transition-colors"
        aria-label="Toggle billing period"
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-indigo shadow-glow-sm"
          animate={{ x: isAnnual ? 28 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      </button>
      <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-white" : "text-zinc-500"}`}>
        Anual
      </span>
      {isAnnual && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 border border-brand-500/20"
        >
          -20%
        </motion.span>
      )}
    </div>
  );
}
