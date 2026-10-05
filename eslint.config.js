import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["dist/", "node_modules/", "research/"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      complexity: ["error", 12],
      "max-depth": ["error", 4],
      "max-len": ["error", {
        code: 100,
        ignoreComments: false,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreUrls: true,
      }],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["error", {
        max: 120,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
      "max-nested-callbacks": ["error", 3],
      "max-params": ["error", 5],
      "max-statements": ["error", 40],
      "no-duplicate-imports": "error",
      "prefer-const": "error",
    },
  },
);
