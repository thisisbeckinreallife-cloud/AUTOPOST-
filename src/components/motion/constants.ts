/* ═══════════════════════════════════════════════════════════════════
   Motion Design Tokens — AutoPost
   ═══════════════════════════════════════════════════════════════════ */

/** Expo-out easing — fast start, gentle deceleration */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Subtle ease for hover states */
export const EASE_HOVER = [0.4, 0, 0.2, 1] as const;

/** Spring config for bouncy elements */
export const SPRING_BOUNCE = { type: "spring" as const, stiffness: 200, damping: 15 };

/** Spring config for smooth elements */
export const SPRING_SMOOTH = { type: "spring" as const, stiffness: 100, damping: 20 };

/** Spring config for counter numbers */
export const SPRING_COUNTER = { type: "spring" as const, stiffness: 50, damping: 20 };

/** Duration presets (seconds) */
export const DURATION = {
  fast: 0.3,
  normal: 0.6,
  slow: 0.9,
  hero: 1.2,
} as const;

/** Stagger delay presets (seconds) */
export const STAGGER = {
  tight: 0.06,
  normal: 0.1,
  wide: 0.15,
} as const;

/** Common reveal variant — fade up from below */
export const revealVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/** Stagger container variant */
export const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER.normal,
    },
  },
};

/** Scale-in variant for badges, icons */
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
};

/** Slide from left */
export const slideLeftVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

/** Slide from right */
export const slideRightVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};
