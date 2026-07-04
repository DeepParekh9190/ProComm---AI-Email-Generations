import { defineConfig } from "eslint/config";
import eslintPluginNext from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  {
    ignores: [
      ".next/",
      "node_modules/",
      "out/",
      "build/",
      "*.config.*",
      "scripts/",
      "scratch/",
      "playwright.config.ts",
      "jest.config.cjs",
      "jest.setup.ts",
      "babel.config.jest.cjs",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: {
      "@next/next": eslintPluginNext,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: {
      react: { version: "19" },
      "import/resolver": { typescript: { alwaysTryTypes: true } },
    },
  },
  prettierConfig,
]);