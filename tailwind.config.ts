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
        display: ['"Instrument Serif"', '"Times New Roman"', "serif"],
        headline: ['"Instrument Serif"', '"Times New Roman"', "serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        /* ══════════════════════════════════════════════════════════════
           brand.* / accent.* / surface.* — Editorial print-zine palette.
           Off-bone paper, tomato stamp, olive, mustard. Ink in 4 tones.
           Cualquier componente con estos tokens se rebrandea automáticamente.
           ══════════════════════════════════════════════════════════════ */
        brand: {
          50:  "#F1ECE2",  // paper
          100: "#E8E2D4",  // paper-2
          200: "#D9D2C2",
          300: "#B8B0A0",
          400: "#5A4F40",  // ink-3 (mid)
          500: "#14110D",  // ink primary
          600: "#0E0B07",  // ink deep
          700: "#2A241D",
          800: "#1F1B14",
          900: "#14110D",
          950: "#0A0805",
        },
        accent: {
          orange:  "#E54B26",  // tomato stamp
          indigo:  "#6B7A2E",  // olive
          violet:  "#6B7A2E",
          blue:    "#6B7A2E",
          emerald: "#6B7A2E",  // olive (same family, success)
          cyan:    "#E54B26",
          coral:   "#D4A627",  // mustard
          red:     "#C73C1B",  // stamp-2 (error)
          slate:   "#8A7E6B",  // ink-4
        },
        surface: {
          primary:   "#F1ECE2",  // paper
          secondary: "#E8E2D4",  // paper-2
          tertiary:  "#E8E2D4",
          card:      "#F1ECE2",
          hover:     "#E8E2D4",
          elevated:  "#F1ECE2",
        },
        neutral: {
          750: "#B8B0A0",
          850: "#D9D2C2",
        },
        hatch: {
          graphite:    "#1D1D1F",
          graphiteAlt: "#2C2C2E",
          athens:      "#F5F5F7",
          surfAlt:     "#E8E8ED",
          silver:      "#86868B",
          silverDark:  "#48484A",
          glow:        "#A8DADC",
          cobalt:      "#7DBCBE",
        },
        /* ══════════════════════════════════════════════════════════════
           TOKENS SEMÁNTICOS — Aluminum Studio Ola 3
           Usar success-/warning-/error-/info-/neutral- en vez de
           green/amber/red/blue/zinc directos. Asegura contraste WCAG AA
           y consistencia entre componentes.
           ══════════════════════════════════════════════════════════════ */
        success: {
          50:  "#E8F5EE",
          100: "#C6E8D2",
          200: "#9DD5B0",
          300: "#6FBC88",
          500: "#34A35A",
          700: "#2D8B55",  // bg pill text + border base
          800: "#1F6B3F",  // text on light
          900: "#13502E",  // text-strong
        },
        warning: {
          50:  "#FBF5E5",
          100: "#F5E6B7",
          200: "#EFD584",
          300: "#E3C16F",
          500: "#D4A843",
          700: "#B88E32",
          800: "#8C6F1F",
          900: "#5C4612",
        },
        error: {
          50:  "#FDE8E8",
          100: "#FACACA",
          200: "#F2A0A0",
          300: "#E97A7A",
          500: "#D74C4C",
          700: "#C93B3B",
          800: "#A02A2A",
          900: "#7A1F1F",
        },
        info: {
          50:  "#E4F2F7",
          100: "#BFDFEB",
          200: "#90C8DC",
          300: "#5FA9C2",
          500: "#3690B4",
          700: "#2A7B9B",
          800: "#1E5F78",
          900: "#16445A",
        },
      },
      borderColor: {
        DEFAULT: "rgba(20,17,13,0.10)",
      },
      boxShadow: {
        /* Editorial: hairline + leve drop. Sin glows. */
        "card":         "0 1px 0 rgba(20,17,13,0.06)",
        "card-hover":   "0 1px 0 rgba(20,17,13,0.08), 3px 3px 0 rgba(20,17,13,0.06)",
        "elevated":     "0 30px 60px -20px rgba(20,17,13,0.18), 0 1px 0 rgba(20,17,13,0.06)",
        "glow-sm":      "0 1px 0 rgba(20,17,13,0.06)",
        "glow":         "0 1px 0 rgba(20,17,13,0.06)",
        "glow-md":      "0 1px 0 rgba(20,17,13,0.06)",
        "glow-lg":      "0 1px 0 rgba(20,17,13,0.06)",
        "glow-amber":   "0 1px 0 rgba(212,166,39,0.30)",
        "glow-blue":    "0 1px 0 rgba(107,122,46,0.30)",
        "glow-orange":  "0 1px 0 rgba(229,75,38,0.20)",
        "glow-indigo":  "0 1px 0 rgba(107,122,46,0.20)",
        "glow-violet":  "0 1px 0 rgba(107,122,46,0.20)",
        "glow-emerald": "0 1px 0 rgba(107,122,46,0.20)",
        "glow-cyan":    "0 1px 0 rgba(229,75,38,0.20)",
        "glow-coral":   "0 1px 0 rgba(212,166,39,0.20)",
        "inner-light":  "inset 0 1px 0 rgba(20,17,13,0.04)",
        "inner-glow":   "inset 0 0 0 0 transparent",
      },
      borderRadius: {
        /* Editorial: sin redondeos exagerados. Mantenemos hairlines rectos. */
        "lg":  "4px",
        "xl":  "4px",
        "2xl": "6px",
        "3xl": "6px",
        "4xl": "8px",
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(168,218,220,0)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(168,218,220,0.12)" },
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
        /* Editorial: degradados muy sutiles sobre papel. Casi imperceptibles. */
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle":  "linear-gradient(145deg, rgba(229,75,38,0.025) 0%, transparent 50%)",
        "gradient-mesh":    "radial-gradient(at 40% 20%, rgba(229,75,38,0.04) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(212,166,39,0.03) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(107,122,46,0.025) 0px, transparent 50%)",
        "gradient-hero":    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(229,75,38,0.06) 0%, transparent 60%)",
        "gradient-cta":     "linear-gradient(135deg, rgba(229,75,38,0.04) 0%, rgba(212,166,39,0.03) 100%)",
        "gradient-spotlight": "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(229,75,38,0.04), transparent 70%)",
        "gradient-brand-vivid": "linear-gradient(135deg, #14110D 0%, #2A241D 100%)",
        "gradient-brand": "linear-gradient(135deg, #14110D 0%, #2A241D 100%)",
        "gradient-magic": "linear-gradient(135deg, #14110D 0%, #E54B26 100%)",
        "gradient-glow": "radial-gradient(600px circle, rgba(229,75,38,0.06), transparent 70%)",
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
