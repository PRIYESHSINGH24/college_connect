import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F7F2",
        ink: "#20231F",
        muted: "#686D68",
        brand: "#5555D9",
        "brand-dark": "#4141B8",
        "brand-soft": "#ECECFC",
        lime: "#C7F36B",
        line: "#E5E5DF",
        surface: "#FFFFFF",
        quiet: "#EFEFE8"
      },
      boxShadow: {
        soft: "0 8px 30px rgba(32, 35, 31, .06)"
      }
    }
  },
  plugins: []
};

export default config;
