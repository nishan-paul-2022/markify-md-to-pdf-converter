import js from "@eslint/js";
import tsEslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import nextPlugin from "@next/eslint-plugin-next";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ELITE Industry Standard ESLint Configuration (STABLE)
 * 
 * Includes:
 * - TypeScript (Strict & Stylistic)
 * - Next.js (Core Web Vitals & v15+ support)
 * - Absolute Path Enforcement (@/ usage everywhere)
 * - React Hooks & A11y
 * - Import Strategy (Sorting & Cleanup)
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
      "*.mjs",
    ],
  },

  // Base JavaScript & TypeScript recommended rules
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.strict,
  ...tsEslint.configs.stylistic,

  // Shared Configuration
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
      "no-relative-import-paths": noRelativeImportPaths,
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // --- Import Path Enforcement (@/ Only) ---
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { "allowSameFolder": false, "rootDir": "src", "prefix": "@" }
      ],

      // --- Next.js Specific Rules ---
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",

      // --- General Code Quality ---
      "no-console": ["error", { allow: ["warn", "error", "info", "debug"] }],
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

  // Typed Linting Configuration
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
