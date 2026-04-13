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
          50: "#EEF4FF",
          100: "#DCE8FD",
          200: "#C1D5FC",
          300: "#96B8F9",
          400: "#6494F4",
          500: "#3D6FEE",
          600: "#2753E3",
          700: "#1F40D0",
          800: "#2035A9",
          900: "#1F3185",
          950: "#172152",
        },
        surface: {
          primary: "#09090B",
          secondary: "#0F1117",
          tertiary: "#18181B",
          card: "#131318",
          hover: "#1C1C22",
          elevated: "#1E1E24",
        },
        neutral: {
          750: "#313137",
          850: "#1F1F23",
        },
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.06)",
      },
      boxShadow: {
        "card": "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        "elevated": "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        "glow-sm": "0 0 12px rgba(61,111,238,0.12)",
        "glow": "0 0 20px rgba(61,111,238,0.15)",
        "glow-md": "0 0 32px rgba(61,111,238,0.18)",
        "glow-lg": "0 0 48px rgba(61,111,238,0.22)",
        "inner-light": "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-subtle": "linear-gradient(145deg, rgba(61,111,238,0.04) 0%, transparent 50%)",
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
