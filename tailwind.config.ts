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
        headline: ['"General Sans"', '"Inter Tight"', "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",  // Primary — electric amber
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        accent: {
          orange:  "#FB923C",  // warm orange
          blue:    "#3B82F6",  // electric blue (trust)
          cyan:    "#06B6D4",  // cyan (info)
          emerald: "#10B981",  // emerald (success)
          red:     "#EF4444",  // red (error/danger)
          slate:   "#64748B",  // muted text
        },
        surface: {
          primary:   "#0B1120",  // deepest navy
          secondary: "#111827",  // dark navy
          tertiary:  "#1F2937",  // medium navy
          card:      "#162032",  // card surface
          hover:     "#1E293B",  // hover state
          elevated:  "#243349",  // elevated/modal
        },
        neutral: {
          750: "#334155",
          850: "#1E293B",
        },
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.09)",
      },
      boxShadow: {
        "card":        "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        "card-hover":  "0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.09)",
        "elevated":    "0 12px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)",
        "glow-sm":     "0 0 15px rgba(245,158,11,0.15), 0 0 5px rgba(245,158,11,0.08)",
        "glow":        "0 0 25px rgba(245,158,11,0.20), 0 0 10px rgba(245,158,11,0.12)",
        "glow-md":     "0 0 40px rgba(245,158,11,0.25), 0 0 15px rgba(245,158,11,0.15)",
        "glow-lg":     "0 0 60px rgba(245,158,11,0.30), 0 0 20px rgba(245,158,11,0.18)",
        "glow-amber":  "0 0 30px rgba(245,158,11,0.20), 0 0 10px rgba(245,158,11,0.12)",
        "glow-blue":   "0 0 30px rgba(59,130,246,0.15), 0 0 10px rgba(59,130,246,0.10)",
        "glow-orange": "0 0 20px rgba(251,146,60,0.25), 0 0 10px rgba(251,146,60,0.12)",
        "inner-light": "inset 0 1px 0 rgba(255,255,255,0.05)",
        "inner-glow":  "inset 0 0 20px rgba(245,158,11,0.05)",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(245,158,11,0)" },
          "50%":      { boxShadow: "0 0 0 5px rgba(245,158,11,0.12)" },
        },
        mockupBlink: {
          "0%, 90%, 100%": { opacity: "1" },
          "95%":           { opacity: "0.4" },
        },
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle":  "linear-gradient(145deg, rgba(245,158,11,0.04) 0%, transparent 50%)",
        "gradient-mesh":    "radial-gradient(at 40% 20%, rgba(245,158,11,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(251,146,60,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(59,130,246,0.04) 0px, transparent 50%)",
        "gradient-hero":    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.15) 0%, transparent 60%)",
        "gradient-cta":     "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,146,60,0.05) 50%, rgba(59,130,246,0.04) 100%)",
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
