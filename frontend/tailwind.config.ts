import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04070F",
          900: "#08101F",
          850: "#0B1630",
          800: "#0F1D3D",
          700: "#16295A",
          600: "#1E3A78",
        },
        volt: {
          DEFAULT: "#2F6BFF",
          300: "#8FB0FF",
          400: "#5B8DFF",
          500: "#2F6BFF",
          600: "#1F52D6",
        },
        silver: {
          100: "#F2F5FA",
          200: "#DDE4EF",
          300: "#C0CADB",
          400: "#98A5BC",
          500: "#6F7D96",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,141,255,0.35), 0 8px 40px -8px rgba(47,107,255,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.8)",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        pulseDot: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        scan: "scan 6s linear infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
