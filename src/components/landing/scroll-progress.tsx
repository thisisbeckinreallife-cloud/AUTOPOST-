"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 25, restDelta: 0.001 });
  const opacity = useTransform(scrollYProgress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.8, 0.3]);

  return (
    <>
      {/* Track */}
      <div className="fixed top-0 right-0 w-[2px] h-screen z-50 bg-black/[0.05]" />
      {/* Progress */}
      <motion.div
        className="fixed top-0 right-0 w-[2px] h-screen z-50 origin-top scroll-progress-bar"
        style={{ scaleY, opacity }}
      />
      {/* Glow dot at current position */}
      <motion.div
        className="fixed right-0 w-2 h-2 z-50 rounded-full"
        style={{
          top: useTransform(scaleY, (v) => `${v * 100}vh`),
          opacity: glowOpacity,
          background: "#FFAA00",
          boxShadow: "0 0 12px rgba(255,170,0,0.6), 0 0 4px rgba(255,170,0,0.3)",
          transform: "translateX(1px) translateY(-4px)",
        }}
      />
    </>
  );
}
