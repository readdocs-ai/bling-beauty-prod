import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FFF8F1",
        cream: "#FAF1E7",
        peach: "#FFE2CF",
        orange: "#F47C20",
        tangerine: "#FF9B3D",
        coral: "#FF6A3D",
        gold: "#FFD166",
        "soft-black": "#1E1B18",
        charcoal: "#191512",
        cocoa: "#6F4A35",
        mist: "#F6EEE7",
        champagne: "#E9B66D",
        rose: "#F4B8A4",
      },
      boxShadow: {
        luxe: "0 30px 80px rgba(92, 48, 18, 0.16)",
        soft: "0 16px 45px rgba(92, 48, 18, 0.10)",
        glow: "0 18px 60px rgba(244, 124, 32, 0.22)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      backgroundImage: {
        "vitamin-glow":
          "radial-gradient(900px 450px at 8% 8%, rgba(255,155,61,0.24), transparent 60%), radial-gradient(760px 420px at 92% 18%, rgba(255,106,61,0.18), transparent 58%), linear-gradient(180deg, #FFF8F1 0%, #FAF1E7 100%)",
        "orange-luxe": "linear-gradient(135deg, #F47C20 0%, #FF9B3D 48%, #FFD166 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
