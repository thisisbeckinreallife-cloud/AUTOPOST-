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
        /* ══════════════════════════════════════════════════════════════
           brand.* y accent.* ahora son ALIASES a Aluminum Studio.
           Los valores antiguos (gold/indigo AutoPost) se preservan como
           comentarios para rollback. Esto permite rebrand instantáneo de
           127+ clases en admin/auth sin tocar JSX.
           ══════════════════════════════════════════════════════════════ */
        brand: {
          50:  "#FAFAFC",  // (was #FFF8E0 gold tint)
          100: "#F5F5F7",  // Athens
          200: "#E8E8ED",  // surfAlt
          300: "#D1D1D6",
          400: "#86868B",  // silver (was #FFC626 gold)
          500: "#1D1D1F",  // graphite primary (was #FFAA00 gold)
          600: "#0A0A0F",  // ink (was #CC8800)
          700: "#48484A",
          800: "#2C2C2E",
          900: "#1D1D1F",
          950: "#0A0A0F",
        },
        accent: {
          orange:  "#A8DADC",  // cobalt glow (was #FB923C orange)
          indigo:  "#7DBCBE",  // cobalt deep (was #6366F1 indigo)
          violet:  "#7DBCBE",
          blue:    "#7DBCBE",
          emerald: "#16A34A",  // true green preserved for success states
          cyan:    "#A8DADC",
          coral:   "#86868B",  // silver (was #F97066 coral)
          red:     "#DC2626",  // error preserved
          slate:   "#64748B",
        },
        surface: {
          primary:   "#FFFFFF",
          secondary: "#FAFAFA",
          tertiary:  "#F5F5F7",
          card:      "#FFFFFF",
          hover:     "#F0F0F2",
          elevated:  "#FFFFFF",
        },
        neutral: {
          750: "#D1D1D6",
          850: "#E5E5EA",
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
        DEFAULT: "rgba(0,0,0,0.06)",
      },
      boxShadow: {
        "card":         "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover":   "0 8px 28px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        "elevated":     "0 12px 40px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.03)",
        "glow-sm":      "0 0 15px rgba(168,218,220,0.10), 0 0 5px rgba(168,218,220,0.05)",
        "glow":         "0 0 25px rgba(168,218,220,0.14), 0 0 10px rgba(168,218,220,0.08)",
        "glow-md":      "0 0 40px rgba(168,218,220,0.18), 0 0 15px rgba(168,218,220,0.10)",
        "glow-lg":      "0 0 60px rgba(168,218,220,0.22), 0 0 25px rgba(168,218,220,0.12)",
        "glow-amber":   "0 0 30px rgba(168,218,220,0.14), 0 0 10px rgba(168,218,220,0.08)",
        "glow-blue":    "0 0 30px rgba(59,130,246,0.12), 0 0 10px rgba(59,130,246,0.06)",
        "glow-orange":  "0 0 20px rgba(168,218,220,0.18), 0 0 10px rgba(168,218,220,0.08)",
        "glow-indigo":  "0 0 30px rgba(125,188,190,0.14), 0 0 10px rgba(125,188,190,0.08)",
        "glow-violet":  "0 0 30px rgba(125,188,190,0.14), 0 0 10px rgba(125,188,190,0.08)",
        "glow-emerald": "0 0 20px rgba(52,211,153,0.14), 0 0 10px rgba(52,211,153,0.08)",
        "glow-cyan":    "0 0 20px rgba(52,211,153,0.14), 0 0 10px rgba(52,211,153,0.08)",
        "glow-coral":   "0 0 20px rgba(134,134,139,0.14), 0 0 10px rgba(134,134,139,0.08)",
        "inner-light":  "inset 0 1px 0 rgba(0,0,0,0.03)",
        "inner-glow":   "inset 0 0 20px rgba(168,218,220,0.03)",
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
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle":  "linear-gradient(145deg, rgba(168,218,220,0.04) 0%, transparent 50%)",
        "gradient-mesh":    "radial-gradient(at 40% 20%, rgba(168,218,220,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168,218,220,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(125,188,190,0.04) 0px, transparent 50%)",
        "gradient-hero":    "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168,218,220,0.15) 0%, transparent 60%)",
        "gradient-cta":     "linear-gradient(135deg, rgba(168,218,220,0.08) 0%, rgba(168,218,220,0.05) 50%, rgba(125,188,190,0.04) 100%)",
        "gradient-spotlight": "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(168,218,220,0.06), transparent 70%)",
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
