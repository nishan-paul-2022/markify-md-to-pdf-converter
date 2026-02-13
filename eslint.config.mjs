import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tsEslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Top-tier industry standard ESLint configuration for Next.js, TypeScript, and React.
 * This configuration focuses on:
 * 1. Strict Type Safety (via typescript-eslint strict/stylistic)
 * 2. Consistent Import Organization (via simple-import-sort)
 * 3. Aggressive Cleanup (via unused-imports)
 * 4. Accessibility Compliance (via jsx-a11y)
 * 5. General Code Quality (no-console, eqeqeq, prefer-const)
 */
export default tsEslint.config(
  // Global Ignores
  {
    ignores: [
      ".next/",
      "out/",
      "build/",
      "next-env.d.ts",
      "public/",
      "node_modules/",
      "**/dist/",
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended, strict, and stylistic
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.strict,
  ...tsEslint.configs.stylistic,

  // Shared Configuration (Plugins & Non-typed rules)
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
    },
    rules: {
      // --- General Code Quality ---
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "curly": "error",
      "eqeqeq": ["error", "always"],
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "no-trailing-spaces": "error",
      "semi": ["error", "always"],

      // --- Import Hierarchy & Sorting ---
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react", "^@react", "^next", "^@next"],
            ["^@/"],
            ["^\\u0000"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?![^/]*//)(?!/?$)", "^\\./?$"],
            ["^.+\\.?(css)$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // --- Unused Imports & Variables ---
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_",
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // --- React Hooks ---
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // --- Accessibility ---
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
    },
  },

  // Typed Linting Configuration (Only for TS files included in tsconfig.json)
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/restrict-plus-operands": "error",
    },
  }
);
