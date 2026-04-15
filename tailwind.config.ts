import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Satoshi", "Inter", "system-ui", "sans-serif"],
        headline: ["Satoshi", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#FFF8E0",
          100: "#FFECB3",
          200: "#FFE080",
          300: "#FFD24D",
          400: "#FFC626",
          500: "#FFAA00",  // Primary — deep premium gold
          600: "#CC8800",
          700: "#996600",
          800: "#664400",
          900: "#332200",
          950: "#1A1100",
        },
        accent: {
          orange:  "#FB923C",  // warm orange
          indigo:  "#6366F1",  // modern indigo (replaces violet)
          violet:  "#6366F1",  // alias for backward compat
          blue:    "#3B82F6",  // electric blue (trust)
          emerald: "#34D399",  // warm emerald (replaces cyan)
          cyan:    "#34D399",  // alias for backward compat
          coral:   "#F97066",  // coral (urgency, "before" states)
          red:     "#EF4444",  // red (error/danger)
          slate:   "#7C8DB5",  // muted text (WCAG compliant)
        },
        surface: {
          primary:   "#06080D",  // obsidian black — deepest
          secondary: "#0C0F16",  // dark obsidian
          tertiary:  "#161A24",  // medium obsidian
          card:      "#11141C",  // card surface
          hover:     "#1A1E28",  // hover state
          elevated:  "#1E2230",  // elevated/modal
        },
        neutral: {
          750: "#2A2E3A",
          850: "#1A1E28",
        },
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.08)",
      },
      boxShadow: {
        "card":         "0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover":   "0 8px 28px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)",
        "elevated":     "0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
        "glow-sm":      "0 0 15px rgba(255,170,0,0.15), 0 0 5px rgba(255,170,0,0.08)",
        "glow":         "0 0 25px rgba(255,170,0,0.22), 0 0 10px rgba(255,170,0,0.14)",
        "glow-md":      "0 0 40px rgba(255,170,0,0.28), 0 0 15px rgba(255,170,0,0.16)",
        "glow-lg":      "0 0 60px rgba(255,170,0,0.35), 0 0 25px rgba(255,170,0,0.20)",
        "glow-amber":   "0 0 30px rgba(255,170,0,0.22), 0 0 10px rgba(255,170,0,0.14)",
        "glow-blue":    "0 0 30px rgba(59,130,246,0.18), 0 0 10px rgba(59,130,246,0.10)",
        "glow-orange":  "0 0 20px rgba(251,146,60,0.28), 0 0 10px rgba(251,146,60,0.14)",
        "glow-indigo":  "0 0 30px rgba(99,102,241,0.22), 0 0 10px rgba(99,102,241,0.12)",
        "glow-violet":  "0 0 30px rgba(99,102,241,0.22), 0 0 10px rgba(99,102,241,0.12)",
        "glow-emerald": "0 0 20px rgba(52,211,153,0.22), 0 0 10px rgba(52,211,153,0.12)",
        "glow-cyan":    "0 0 20px rgba(52,211,153,0.22), 0 0 10px rgba(52,211,153,0.12)",
        "glow-coral":   "0 0 20px rgba(249,112,102,0.22), 0 0 10px rgba(249,112,102,0.12)",
        "inner-light":  "inset 0 1px 0 rgba(255,255,255,0.05)",
        "inner-glow":   "inset 0 0 20px rgba(255,170,0,0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.75rem",
      },
      animation: {
        "fade-in":       "fadeIn 0.5s ease-out both",
        "fade-up":       "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up":      "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down":    "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in":      "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "reveal":        "reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float":         "float 6s ease-in-out infinite",
        "drift":         "drift 8s ease-in-out infinite",
        "glow-pulse":    "glowPulse 4s ease-in-out infinite",
        "shimmer":       "shimmer 2s infinite linear",
        "pulse-subtle":  "pulseSubtle 3s ease-in-out infinite",
        "spin-slow":     "spin 3s linear infinite",
        "gradient-x":    "gradientX 8s ease infinite",
        "border-flow":   "borderFlow 4s linear infinite",
        "cta-pulse":     "ctaPulse 2s ease-in-out infinite",
        "mockup-blink":  "mockupBlink 3s ease-in-out infinite",
        "marquee":       "marquee 30s linear infinite",
        "marquee-slow":  "marquee 45s linear infinite",
        "rotate-border": "rotateBorder 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        reveal: {
          "0%":   { opacity: "0", transform: "translateY(30px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%":      { transform: "translate(5px, -8px) rotate(1.5deg)" },
          "66%":      { transform: "translate(-4px, 4px) rotate(-0.8deg)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.3" },
          "50%":      { opacity: "0.7" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        borderFlow: {
          "0%":   { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
        ctaPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,170,0,0)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(255,170,0,0.12)" },
        },
        mockupBlink: {
          "0%, 90%, 100%": { opacity: "1" },
          "95%":           { opacity: "0.4" },
        },
        marquee: {
          "0%":   { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        rotateBorder: {
          "0%":   { "--angle": "0deg" },
          "100%": { "--angle": "360deg" },
        },
        textShimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle":  "linear-gradient(145deg, rgba(255,170,0,0.04) 0%, transparent 50%)",
        "gradient-mesh":    "radial-gradient(at 40% 20%, rgba(255,170,0,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(251,146,60,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(99,102,241,0.04) 0px, transparent 50%)",
        "gradient-hero":    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,170,0,0.15) 0%, transparent 60%)",
        "gradient-cta":     "linear-gradient(135deg, rgba(255,170,0,0.08) 0%, rgba(251,146,60,0.05) 50%, rgba(99,102,241,0.04) 100%)",
        "gradient-spotlight": "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(255,170,0,0.06), transparent 70%)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
    },
  },
  plugins: [],
};

export default config;
