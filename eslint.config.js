import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "dev-dist", "playwright-report", "test-results"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      prettier,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },
    rules: {
      // ESLint sin eslint-plugin-react no ve el uso de componentes en JSX:
      // sin esta excepción marcaría como "sin usar" cada componente importado.
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
  {
    // Archivos que a propósito exportan un componente junto a su hook o
    // helper (AuthProvider + useAuth, Icon + iconoHTML...). Lo único que se
    // pierde es el fast refresh de ese archivo en desarrollo (recarga entera).
    files: ["src/contexto/**", "src/componentes/Icon.jsx", "src/componentes/OnboardingTour.jsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },
  {
    // Vitest corre con globals: true (ver test en vite.config.js).
    files: ["src/pruebas/**"],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } },
  },
  {
    // Service worker de push (ver vite.config.js): corre en el contexto del SW.
    files: ["public/push-sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ["vite.config.js", "eslint.config.js", "playwright.config.js"],
    languageOptions: { globals: globals.node },
  },
]);
