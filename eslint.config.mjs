import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const unsafe = ["assignment", "call", "member-access", "return", "argument"];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Bugs
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"], // Braces unless the `if` fits on one line.
      "no-empty": ["error", { allowEmptyCatch: false }],

      // Types
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-condition": "error", // Noisy at times: disable per line, with a reason.
      "@typescript-eslint/switch-exhaustiveness-check": ["error", { requireDefaultForNonUnion: true }],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
      ...Object.fromEntries(unsafe.map((name) => [`@typescript-eslint/no-unsafe-${name}`, "error"])),

      // Promises: every error handled
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
]);