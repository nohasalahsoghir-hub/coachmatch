import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand / action color — reserved for actions only.
        flare: {
          DEFAULT: "#FF6A3D",
          50: "rgba(255,106,61,0.05)",
          100: "rgba(255,106,61,0.10)",
          200: "rgba(255,106,61,0.20)",
          300: "rgba(255,106,61,0.30)",
          400: "rgba(255,106,61,0.50)",
          500: "#FF6A3D",
          600: "#E05530",
          700: "#B8421F",
        },
        // App-wide neutral scale — no sport metaphor.
        ink: {
          950: "#0D1512",
          900: "#1A2821",
          800: "#223229",
          700: "#2B3D32",
          600: "#34483B",
          500: "#405447",
          400: "#4D6254",
        },
        // Sport families. These must never be used as action/brand colors.
        combat:  { DEFAULT: "#F05A28", muted: "rgba(240,90,40,0.12)", text: "#FFAA8A" },
        water:   { DEFAULT: "#2E9FC7", muted: "rgba(46,159,199,0.12)", text: "#7DD3F0" },
        fit:     { DEFAULT: "#E8A33D", muted: "rgba(232,163,61,0.12)", text: "#F5C978" },
        racquet: { DEFAULT: "#00A6A6", muted: "rgba(0,166,166,0.12)", text: "#72D8D8" },
        team:    { DEFAULT: "#7B5CF6", muted: "rgba(123,92,246,0.12)", text: "#C4B0FF" },
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
        "card-glow": "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(255,106,61,.06), transparent)",
      },
      boxShadow: {
        "flare-sm": "0 0 0 1px rgba(255,106,61,.25)",
        "flare-md": "0 0 20px rgba(255,106,61,.15), 0 0 0 1px rgba(255,106,61,.20)",
        surface: "0 1px 3px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)",
      },
      animation: {
        "fade-up": "fadeUp 0.35s ease both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 1.6s linear infinite",
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
