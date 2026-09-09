import js from "@eslint/js";

// Every app file is a browser IIFE loaded via <script> in index.html, so they
// all share the same ambient globals. Listing them once keeps the config from
// drifting each time a file starts touching the DOM.
const browserGlobals = {
  AbortController: "readonly",
  alert: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  document: "readonly",
  fetch: "readonly",
  localStorage: "readonly",
  navigator: "readonly",
  setTimeout: "readonly",
  window: "readonly"
};

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: browserGlobals
    },
    rules: {
      "no-var": "error",
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
      "no-implicit-globals": "error"
    }
  },
  {
    // validation.js also runs under Node (CommonJS export) for the test suite.
    files: ["validation.js"],
    languageOptions: {
      globals: { ...browserGlobals, module: "readonly" }
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...browserGlobals,
        afterEach: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        vi: "readonly",
        process: "readonly",
        global: "readonly"
      }
    }
  },
  {
    files: ["eslint.config.js"],
    languageOptions: { globals: {} }
  }
];
