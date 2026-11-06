import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    // Fichiers de configuration exécutés par Node
    files: ["*.config.js"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      // Composant utilisé en JSX sans être importé → page blanche à l'exécution
      "react/jsx-no-undef": "error",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^[A-Z_]" }],
      // Règles liées au React Compiler (non utilisé ici) : signalées sans bloquer.
      // Les pages concernées seront réécrites pendant la refonte (phases 1 et 2).
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
]);
