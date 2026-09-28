import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cobalt: {
          DEFAULT: "#3E6FF2",
          50: "rgba(62,111,242,0.05)",
          100: "rgba(62,111,242,0.10)",
          200: "rgba(62,111,242,0.20)",
          300: "#8FACF7",
          400: "rgba(62,111,242,0.50)",
          500: "#3E6FF2",
          600: "#2F58C4",
          700: "#24449A",
        },
        charcoal: {
          50: "#F5F6F7",
          100: "#E9EBEE",
          200: "#C9CDD2",
          300: "#A2A7AE",
          400: "#7A828B",
          500: "#606873",
          600: "#48505A",
          700: "#343A42",
          800: "#262B31",
          900: "#1C2025",
          950: "#15181C",
        },
        combat:  { DEFAULT: "#E0483F", muted: "rgba(224,72,63,0.12)", text: "#FF9A92" },
        water:   { DEFAULT: "#14B8A6", muted: "rgba(20,184,166,0.12)", text: "#76E4D5" },
        fit:     { DEFAULT: "#E8A33D", muted: "rgba(232,163,61,0.12)", text: "#F5C978" },
        racquet: { DEFAULT: "#8B5CF6", muted: "rgba(139,92,246,0.12)", text: "#C4B0FF" },
        team:    { DEFAULT: "#E0609C", muted: "rgba(224,96,156,0.12)", text: "#F4A6C9" },
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
        24: "96px",
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "sans-serif"],
        display: ["var(--font-changa)", "Changa", "sans-serif"],
      },
      backgroundImage: {
        "card-glow": "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(62,111,242,.06), transparent)",
      },
      boxShadow: {
        "cobalt-sm": "0 0 0 1px rgba(62,111,242,.25)",
        "cobalt-md": "0 0 20px rgba(62,111,242,.15), 0 0 0 1px rgba(62,111,242,.20)",
        surface: "0 1px 3px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)",
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
