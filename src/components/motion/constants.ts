/* ═══════════════════════════════════════════════════════════════════
   Motion Design Tokens — AutoPost v2
   Cinema-grade animation system
   ═══════════════════════════════════════════════════════════════════ */

// ─── Easing Curves ───
/** Apple-style expo-out — fast start, silk-smooth deceleration */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Cinematic ease — dramatic slow-in, sharp snap */
export const EASE_CINEMATIC = [0.22, 0.68, 0, 1] as const;

/** Elastic feel — slight overshoot then settle */
export const EASE_ELASTIC = [0.175, 0.885, 0.32, 1.275] as const;

/** Subtle ease for hover states */
export const EASE_HOVER = [0.4, 0, 0.2, 1] as const;

/** Power4.out — strong deceleration for hero reveals */
export const EASE_POWER4 = [0.25, 0.46, 0.45, 0.94] as const;

/** Back-out — overshoots slightly then returns */
export const EASE_BACK_OUT = [0.34, 1.56, 0.64, 1] as const;

// ─── Spring Configs ───
/** Bouncy spring — buttons, badges, icons */
export const SPRING_BOUNCE = { type: "spring" as const, stiffness: 300, damping: 15, mass: 0.8 };

/** Smooth spring — page elements, cards */
export const SPRING_SMOOTH = { type: "spring" as const, stiffness: 120, damping: 20, mass: 1 };

/** Snappy spring — toggles, micro-interactions */
export const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.5 };

/** Wobbly spring — playful elements */
export const SPRING_WOBBLY = { type: "spring" as const, stiffness: 180, damping: 12, mass: 1.2 };

/** Counter spring — number animations */
export const SPRING_COUNTER = { type: "spring" as const, stiffness: 50, damping: 20, mass: 1 };

/** Magnetic spring — cursor-following elements */
export const SPRING_MAGNETIC = { type: "spring" as const, stiffness: 150, damping: 15, mass: 0.5 };

// ─── Duration Presets (seconds) ───
export const DURATION = {
  micro: 0.15,  // micro-interactions
  fast: 0.3,    // hover states, toggles
  normal: 0.6,  // standard reveals
  slow: 0.9,    // section reveals
  hero: 1.2,    // hero entrance
  cinematic: 1.8, // dramatic reveals
} as const;

// ─── Stagger Presets (seconds) ───
export const STAGGER = {
  micro: 0.04,   // rapid-fire (characters)
  tight: 0.06,   // fast stagger (icons, badges)
  normal: 0.1,   // standard (cards, items)
  wide: 0.15,    // dramatic (sections)
  cinematic: 0.2, // hero sequence
} as const;

// ─── Reveal Variants ───
/** Fade up from below with blur — default section reveal */
export const revealVariants = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: DURATION.slow, ease: EASE_OUT_EXPO },
  },
};

/** Scale in with rotation — badges, icons */
export const popVariants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -8 },
  visible: {
    opacity: 1, scale: 1, rotate: 0,
    transition: SPRING_BOUNCE,
  },
};

/** Slide from left with parallax */
export const slideLeftVariants = {
  hidden: { opacity: 0, x: -60, rotateY: 8 },
  visible: {
    opacity: 1, x: 0, rotateY: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT_EXPO },
  },
};

/** Slide from right with parallax */
export const slideRightVariants = {
  hidden: { opacity: 0, x: 60, rotateY: -8 },
  visible: {
    opacity: 1, x: 0, rotateY: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT_EXPO },
  },
};

/** Scale-in variant for badges, icons */
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
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

// ─── Hero Sequence Timings ───
export const HERO_SEQ = {
  navbar: 0,
  badge: 0.3,
  headline: 0.5,
  subtitle: 1.0,
  ctas: 1.3,
  trust: 1.6,
  scene: 1.8,
} as const;
