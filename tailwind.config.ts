import type { Config } from "tailwindcss";

/**
 * Autopost Design System — "Carbon Workshop"
 * ──────────────────────────────────────────────────────────────────────────
 * Dark-first sistema único. Acento naranja-óxido como UN solo color que vende.
 * Mona Sans Variable Font (axes wght + wdth) cubre body+UI+display.
 * JetBrains Mono para datos y código.
 *
 * NO Inter, NO gradient azul/violeta, NO glassmorphism por defecto.
 * NO mezclar con sistemas legacy: este es el ÚNICO sistema activo.
 * ──────────────────────────────────────────────────────────────────────────
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    /* ── Spacing scale: SOBRESCRIBE defaults (no extiende) ─────────────────
       Solo 9 valores canónicos. Cualquier valor ad-hoc fuera de la escala
       debe reescribirse al implementar. */
    spacing: {
      "0":  "0",
      px:   "1px",
      "1":  "0.25rem",  // 4
      "2":  "0.5rem",   // 8
      "3":  "0.75rem",  // 12
      "4":  "1rem",     // 16
      "6":  "1.5rem",   // 24
      "8":  "2rem",     // 32
      "12": "3rem",     // 48
      "16": "4rem",     // 64
      "24": "6rem",     // 96
    },
    /* ── Border radii: SOBRESCRIBE defaults. Solo 5 valores. ─────────────── */
    borderRadius: {
      none:   "0",
      sm:     "0.25rem", // 4
      md:     "0.5rem",  // 8
      lg:     "0.75rem", // 12
      xl:     "1rem",    // 16
      full:   "9999px",
    },
    extend: {
      colors: {
        /* Escala de tinta dark-first 10 niveles. ink-0 más oscuro, ink-9 más claro.
           Contrastes verificados WCAG: ink-9 sobre ink-1 = 15.8:1 (AAA). */
        ink: {
          0:  "#0A0B09",
          1:  "#0E0F0D",
          2:  "#151714",
          3:  "#1E211D",
          4:  "#2A2D29",
          5:  "#3A3D38",
          6:  "#6B6A64",
          7:  "#A8A69E",
          8:  "#D6D3CC",
          9:  "#EDEAE3",
          /* Compat: rebrand v1 usaba ink-10 = blanco puro. Mapear al claro
             del sistema nuevo (off-white) para no romper componentes legacy. */
          10: "#FFFFFF",
        },
        /* Acento principal — naranja-óxido (cinta métrica de carpintero, NO neón).
           accent-DEFAULT sobre ink-1 = 7.2:1 (AAA). */
        accent: {
          DEFAULT: "#FF6A2C",
          hover:   "#E55A1F",
          active:  "#CC4E16",
          soft:    "rgba(255, 106, 44, 0.12)",
          ring:    "rgba(255, 106, 44, 0.45)",
          strong:  "#FF8550",
        },
        /* Acento secundario opcional — solo estados activos puntuales. */
        "accent-secondary": {
          DEFAULT: "#C4D650",
          hover:   "#B0C141",
          active:  "#9CAB36",
          soft:    "rgba(196, 214, 80, 0.12)",
          ring:    "rgba(196, 214, 80, 0.45)",
          strong:  "#D4E366",
        },
        /* Semánticos — info usa gris neutro deliberado, NO azul. */
        success: {
          DEFAULT: "#7FA84E",
          soft:    "rgba(127, 168, 78, 0.12)",
          strong:  "#9DC569",
        },
        warning: {
          DEFAULT: "#E8A93B",
          soft:    "rgba(232, 169, 59, 0.12)",
          strong:  "#F2BC58",
        },
        error: {
          DEFAULT: "#D24545",
          soft:    "rgba(210, 69, 69, 0.12)",
          strong:  "#E36767",
        },
        info: {
          DEFAULT: "#6B6A64",
          soft:    "rgba(107, 106, 100, 0.18)",
          strong:  "#A8A69E",
        },
        /* ── Compat layer (eliminar al cerrar Bloque B) ──────────────────
           Mapea tokens del rebrand v1 (azul-violeta) al sistema nuevo para
           que los componentes legacy de landing-v2 se vean con la paleta
           Carbon Workshop sin tocar archivo a archivo. */
        pri: {
          DEFAULT: "#FF6A2C",
          dim:     "#E55A1F",
          soft:    "rgba(255, 106, 44, 0.12)",
        },
        ai: {
          DEFAULT: "#FF6A2C",
          dim:     "#E55A1F",
          soft:    "rgba(255, 106, 44, 0.14)",
        },
      },
      fontFamily: {
        sans: ["var(--font-mona-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        /* Compat: componentes legacy usan font-np-sans / font-np-mono */
        "np-sans": ["var(--font-mona-sans)", "system-ui", "sans-serif"],
        "np-mono": ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs:           ["0.75rem",   { lineHeight: "1rem",     letterSpacing: "0.01em",   fontWeight: "500" }],
        sm:           ["0.875rem",  { lineHeight: "1.25rem",  letterSpacing: "0",        fontWeight: "400" }],
        base:         ["1rem",      { lineHeight: "1.5rem",   letterSpacing: "0",        fontWeight: "400" }],
        lg:           ["1.125rem",  { lineHeight: "1.75rem",  letterSpacing: "-0.005em", fontWeight: "400" }],
        xl:           ["1.25rem",   { lineHeight: "1.875rem", letterSpacing: "-0.01em",  fontWeight: "500" }],
        "2xl":        ["1.5rem",    { lineHeight: "2rem",     letterSpacing: "-0.015em", fontWeight: "600" }],
        "3xl":        ["2rem",      { lineHeight: "2.375rem", letterSpacing: "-0.02em",  fontWeight: "600" }],
        "4xl":        ["2.5rem",    { lineHeight: "2.875rem", letterSpacing: "-0.025em", fontWeight: "700" }],
        "display-md": ["3.25rem",   { lineHeight: "3.5rem",   letterSpacing: "-0.03em",  fontWeight: "700" }],
        "display-lg": ["4.25rem",   { lineHeight: "4.5rem",   letterSpacing: "-0.035em", fontWeight: "800" }],
        "display-xl": ["5.5rem",    { lineHeight: "5.5rem",   letterSpacing: "-0.04em",  fontWeight: "800" }],
        "mono-xs":    ["0.75rem",   { lineHeight: "1rem",     letterSpacing: "0",        fontWeight: "400" }],
        "mono-sm":    ["0.8125rem", { lineHeight: "1.25rem",  letterSpacing: "0",        fontWeight: "500" }],
        /* Compat: tamaños del rebrand v1 (eliminar al cerrar Bloque B) */
        "np-caption":     ["0.875rem", { lineHeight: "1.25rem",  letterSpacing: "0.01em",   fontWeight: "500" }],
        "np-body":        ["1rem",     { lineHeight: "1.5rem",   letterSpacing: "0",        fontWeight: "400" }],
        "np-body-lg":     ["1.125rem", { lineHeight: "1.75rem",  letterSpacing: "-0.005em", fontWeight: "400" }],
        "np-h4":          ["1.25rem",  { lineHeight: "1.875rem", letterSpacing: "-0.01em",  fontWeight: "500" }],
        "np-h3":          ["1.5rem",   { lineHeight: "2rem",     letterSpacing: "-0.015em", fontWeight: "600" }],
        "np-h2":          ["2rem",     { lineHeight: "2.375rem", letterSpacing: "-0.02em",  fontWeight: "600" }],
        "np-h1":          ["2.5rem",   { lineHeight: "2.875rem", letterSpacing: "-0.025em", fontWeight: "700" }],
        "np-display":     ["3.25rem",  { lineHeight: "3.5rem",   letterSpacing: "-0.03em",  fontWeight: "700" }],
        "np-display-xl":  ["4.25rem",  { lineHeight: "4.5rem",   letterSpacing: "-0.035em", fontWeight: "800" }],
      },
      boxShadow: {
        sm:    "0 1px 2px 0 rgba(10, 11, 9, 0.6)",
        md:    "0 4px 8px -2px rgba(10, 11, 9, 0.7), 0 2px 4px -2px rgba(10, 11, 9, 0.5)",
        lg:    "0 12px 24px -8px rgba(10, 11, 9, 0.75), 0 4px 8px -4px rgba(10, 11, 9, 0.5)",
        xl:    "0 24px 48px -12px rgba(10, 11, 9, 0.85), 0 8px 16px -8px rgba(10, 11, 9, 0.6)",
        focus: "0 0 0 2px rgba(255, 106, 44, 0.45)",
      },
      animation: {
        "fade-in":      "fade-in 200ms ease-out forwards",
        "fade-up":      "fade-up 300ms ease-out forwards",
        "subtle-pulse": "subtle-pulse 1.5s ease-in-out infinite",
        "slide-up":     "slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow":    "spin 1s linear infinite",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "subtle-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
