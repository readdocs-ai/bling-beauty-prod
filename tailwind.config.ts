import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F8F3EA",
        "soft-black": "#151515",
        champagne: "#D6B77B",
        rose: "#E7C3C3",
        mist: "#F4F4F5",
      },
      boxShadow: {
        luxe: "0 20px 50px rgba(0,0,0,0.10)",
        soft: "0 12px 30px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      backgroundImage: {
        "gold-fade":
          "radial-gradient(1200px 600px at 10% 10%, rgba(214,183,123,0.25), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(231,195,195,0.25), transparent 60%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
