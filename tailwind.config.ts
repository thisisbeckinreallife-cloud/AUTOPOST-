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
        /* ════════════════════════════════════════════════════════════════
           TOKENS THEMEABLES — RGB triplets vía CSS variables.
           :root define los valores DARK (Ink & Rust — landing).
           .ap-root (scope dashboard) los sobrescribe a LIGHT (Resend).
           Misma clase `bg-ink-2` rinde dark en landing, light en dashboard.
           Formato `rgb(var(--x) / <alpha-value>)` preserva las opacidades
           de Tailwind (bg-ink-2/60, border-error/30, etc.).
           ════════════════════════════════════════════════════════════════ */
        ink: {
          0:  "rgb(var(--ink-0) / <alpha-value>)",
          1:  "rgb(var(--ink-1) / <alpha-value>)",
          2:  "rgb(var(--ink-2) / <alpha-value>)",
          3:  "rgb(var(--ink-3) / <alpha-value>)",
          4:  "rgb(var(--ink-4) / <alpha-value>)",
          5:  "rgb(var(--ink-5) / <alpha-value>)",
          6:  "rgb(var(--ink-6) / <alpha-value>)",
          7:  "rgb(var(--ink-7) / <alpha-value>)",
          8:  "rgb(var(--ink-8) / <alpha-value>)",
          9:  "rgb(var(--ink-9) / <alpha-value>)",
          10: "rgb(var(--ink-10) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          hover:   "rgb(var(--accent-hover) / <alpha-value>)",
          active:  "rgb(var(--accent-active) / <alpha-value>)",
          soft:    "rgb(var(--accent) / 0.12)",
          ring:    "rgb(var(--accent) / 0.45)",
          strong:  "rgb(var(--accent-strong) / <alpha-value>)",
        },
        /* Color de ACCIÓN PRIMARIA (rellenos de botón). Separado del acento:
           en la landing = coral de marca; en el dashboard light = negro
           (monocromo premium). primary-fg = texto sobre el relleno. */
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover:   "rgb(var(--primary-hover) / <alpha-value>)",
          active:  "rgb(var(--primary-active) / <alpha-value>)",
          fg:      "rgb(var(--primary-fg) / <alpha-value>)",
        },
        "accent-secondary": {
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          hover:   "rgb(var(--gold-strong) / <alpha-value>)",
          active:  "rgb(var(--gold) / <alpha-value>)",
          soft:    "rgb(var(--gold) / 0.12)",
          ring:    "rgb(var(--gold) / 0.45)",
          strong:  "rgb(var(--gold-strong) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          soft:    "rgb(var(--gold) / 0.12)",
          strong:  "rgb(var(--gold-strong) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          soft:    "rgb(var(--success) / 0.12)",
          strong:  "rgb(var(--success-strong) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          soft:    "rgb(var(--warning) / 0.12)",
          strong:  "rgb(var(--warning-strong) / <alpha-value>)",
        },
        error: {
          DEFAULT: "rgb(var(--error) / <alpha-value>)",
          soft:    "rgb(var(--error) / 0.12)",
          strong:  "rgb(var(--error-strong) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          soft:    "rgb(var(--info) / 0.12)",
          strong:  "rgb(var(--info-strong) / <alpha-value>)",
        },
        /* ── Compat layer ────────────────────────────────────────────────
           Tokens legacy de landing-v2 (pri/ai) → ahora apuntan al coral
           Ink & Rust. Se mantienen para no reescribir landing-v2 archivo
           a archivo; migración progresiva. */
        pri: {
          DEFAULT: "#E87559",
          dim:     "#D45F44",
          soft:    "rgba(232, 117, 89, 0.12)",
        },
        ai: {
          DEFAULT: "#E87559",
          dim:     "#D45F44",
          soft:    "rgba(232, 117, 89, 0.14)",
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
      /* Sombras neutras y sutiles estilo Resend/Untitled-UI. Correctas sobre
         blanco (dashboard) y discretas sobre el azul-tinta de la landing
         (que de todos modos se apoya en bordes, no en sombras duras). */
      boxShadow: {
        sm:    "0 1px 2px 0 rgb(16 24 40 / 0.05)",
        md:    "0 1px 3px 0 rgb(16 24 40 / 0.10), 0 1px 2px -1px rgb(16 24 40 / 0.06)",
        lg:    "0 4px 8px -2px rgb(16 24 40 / 0.10), 0 2px 4px -2px rgb(16 24 40 / 0.06)",
        xl:    "0 12px 16px -4px rgb(16 24 40 / 0.08), 0 4px 6px -2px rgb(16 24 40 / 0.04)",
        focus: "0 0 0 2px rgb(232 117 89 / 0.45)",
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
