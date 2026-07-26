import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "accent-blue": "#1B4FD8",
        "accent-green": "#10B981",
        card: "rgba(255, 255, 255, 0.03)",
        "card-light": "rgba(255, 255, 255, 0.06)",
        "border-color": "rgba(255, 255, 255, 0.08)",
        secondary: "#94A3B8",
      },
      fontFamily: {
        display: ["var(--font-dm-serif-display)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
