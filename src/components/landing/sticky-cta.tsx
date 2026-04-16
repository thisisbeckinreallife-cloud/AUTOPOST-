"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE_CINEMATIC } from "@/components/motion";

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
        >
          <div className="px-4 py-3 glass-strong">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full bg-gradient-brand-vivid text-white font-semibold py-3.5 rounded-xl text-sm shadow-glow-sm btn-glow active:scale-[0.97] active:translate-y-0.5 transition-transform"
            >
              Programar mi primer mes — Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
