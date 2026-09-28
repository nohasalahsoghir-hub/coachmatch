import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Brand palette ───────────────────────────────────────────
        flare: {
          DEFAULT: "#FF6A3D",
          50:  "rgba(255,106,61,0.05)",
          100: "rgba(255,106,61,0.10)",
          200: "rgba(255,106,61,0.20)",
          300: "rgba(255,106,61,0.30)",
          400: "rgba(255,106,61,0.50)",
          500: "#FF6A3D",
          600: "#E05530",
          700: "#B8421F",
        },
        // ─── Night navy surfaces ──────────────────────────────────────
        pitch: {
          950: "#040B09",  // body bg — deepest ink
          900: "#070F0C",  // page root
          800: "#0A1510",  // card surface
          700: "#0E1C15",  // card hover / elevated
          600: "#13221A",  // input bg
          500: "#19291F",  // border light
          400: "#243328",  // border default
        },
        // ─── Sport-family colors ──────────────────────────────────────
        // Combat / Martial Arts — scarlet
        combat:  { DEFAULT: "#E03A3A", muted: "rgba(224,58,58,0.12)",  text: "#F98787" },
        // Water sports — cerulean
        water:   { DEFAULT: "#2E9FC7", muted: "rgba(46,159,199,0.12)", text: "#7DD3F0" },
        // Fitness / Endurance / Movement — flare orange (shared w/ brand)
        fit:     { DEFAULT: "#FF6A3D", muted: "rgba(255,106,61,0.12)", text: "#FFAB8F" },
        // Racquet sports — lime
        racquet: { DEFAULT: "#78C800", muted: "rgba(120,200,0,0.12)",  text: "#B4E55A" },
        // Team sports — indigo
        team:    { DEFAULT: "#7B5CF6", muted: "rgba(123,92,246,0.12)", text: "#C4B0FF" },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "Cairo", "sans-serif"],
        display: ["var(--font-changa)", "Changa", "sans-serif"],
      },
      backgroundImage: {
        "stadium-hero": [
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,106,61,.18), transparent)",
          "radial-gradient(circle at 90% 80%, rgba(46,159,199,.08), transparent 40%)",
        ].join(", "),
        "card-glow": "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(255,106,61,.06), transparent)",
      },
      boxShadow: {
        "flare-sm": "0 0 0 1px rgba(255,106,61,.25)",
        "flare-md": "0 0 20px rgba(255,106,61,.15), 0 0 0 1px rgba(255,106,61,.20)",
        "surface":  "0 1px 3px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.04)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-up":    "fadeUp 0.35s ease both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer":    "shimmer 1.6s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: " 400px 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
