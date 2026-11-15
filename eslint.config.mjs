import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
export default [...compat.extends("next/core-web-vitals", "next/typescript"), {
  rules: {
    // Source ships copy with raw apostrophes in JSX text; escaping them all is
    // cosmetic and not worth breaking red escape-hatch text. Keep other rules.
    "react/no-unescaped-entities": "off",
  },
}, { ignores: [".next/**", "node_modules/**", "playwright-report/**"] }];
