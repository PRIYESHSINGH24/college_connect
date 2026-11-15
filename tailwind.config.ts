import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { canvas: "#F7F7F2", ink: "#20231F", muted: "#686D68", brand: "#5555D9", line: "#E5E5DF", lime: "#C7F36B" }, boxShadow: { soft: "0 8px 28px rgba(32,35,31,.06)" } } },
  plugins: []
} satisfies Config;
