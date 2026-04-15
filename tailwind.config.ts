import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#F5E6C8",
        "parchment-dark": "#E8D5A3",
        "parchment-light": "#FAF3E0",
        "medieval-brown": "#5C3317",
        "medieval-dark": "#2C1810",
        "medieval-gold": "#D4AF37",
        "medieval-gold-dark": "#B8960C",
        "medieval-burgundy": "#722F37",
        "medieval-green": "#2D5A27",
        "medieval-stone": "#8B8878",
        "medieval-blue": "#2E4A6B",
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)", "serif"],
        garamond: ["var(--font-garamond)", "Georgia", "serif"],
      },
      backgroundImage: {
        "parchment-texture": "url('/parchment.svg')",
      },
      boxShadow: {
        medieval:
          "0 4px 6px -1px rgba(44, 24, 16, 0.2), 0 2px 4px -1px rgba(44, 24, 16, 0.1)",
        "medieval-lg":
          "0 10px 15px -3px rgba(44, 24, 16, 0.25), 0 4px 6px -2px rgba(44, 24, 16, 0.1)",
      },
      borderRadius: {
        medieval: "0.375rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
