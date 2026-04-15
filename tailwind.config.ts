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
        display: ['"Inter Tight"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C3AED",  // Primary violet-blue
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B0764",
          950: "#2E1065",
        },
        accent: {
          violet: "#8B5CF6",
          indigo: "#6366F1",
          cyan:   "#22D3EE",
          emerald: "#34D399",
          amber:  "#FBBF24",
          rose:   "#EC4899",  // Magenta Instagram-aligned
        },
        surface: {
          primary:   "#111120",
          secondary: "#16162A",
          tertiary:  "#1C1C30",
          card:      "#1C1C2E",
          hover:     "#252540",
          elevated:  "#2A2A48",
        },
        neutral: {
          750: "#34344C",
          850: "#1E1E30",
        },
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.09)",
      },
      boxShadow: {
        "card":        "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "card-hover":  "0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.09)",
        "elevated":    "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
        "glow-sm":     "0 0 15px rgba(124,58,237,0.2), 0 0 5px rgba(124,58,237,0.12)",
        "glow":        "0 0 25px rgba(124,58,237,0.25), 0 0 10px rgba(124,58,237,0.18)",
        "glow-md":     "0 0 40px rgba(124,58,237,0.3), 0 0 15px rgba(124,58,237,0.2)",
        "glow-lg":     "0 0 60px rgba(124,58,237,0.35), 0 0 20px rgba(124,58,237,0.25)",
        "glow-violet": "0 0 30px rgba(139,92,246,0.2), 0 0 10px rgba(139,92,246,0.15)",
        "glow-cyan":   "0 0 30px rgba(34,211,238,0.15), 0 0 10px rgba(34,211,238,0.1)",
        "glow-rose":   "0 0 20px rgba(236,72,153,0.3), 0 0 10px rgba(236,72,153,0.15)",
        "inner-light": "inset 0 1px 0 rgba(255,255,255,0.05)",
        "inner-glow":  "inset 0 0 20px rgba(124,58,237,0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
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
          "50%":      { transform: "translateY(-8px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%":      { transform: "translate(4px, -6px) rotate(1deg)" },
          "66%":      { transform: "translate(-3px, 3px) rotate(-0.5deg)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "0.8" },
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0)" },
          "50%":      { boxShadow: "0 0 0 5px rgba(124,58,237,0.12)" },
        },
        mockupBlink: {
          "0%, 90%, 100%": { opacity: "1" },
          "95%":           { opacity: "0.4" },
        },
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle":  "linear-gradient(145deg, rgba(124,58,237,0.04) 0%, transparent 50%)",
        "gradient-mesh":    "radial-gradient(at 40% 20%, rgba(124,58,237,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(236,72,153,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(139,92,246,0.04) 0px, transparent 50%)",
        "gradient-hero":    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.18) 0%, transparent 60%)",
        "gradient-cta":     "linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(236,72,153,0.05) 50%, rgba(139,92,246,0.04) 100%)",
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
