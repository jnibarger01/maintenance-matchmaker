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
      // index.html loads every app file with a plain <script> tag, so they are
      // classic scripts, not modules. Parsing them as modules would accept
      // syntax the browser rejects, and would quietly disable
      // no-implicit-globals, which ESLint only applies to scripts — exactly the
      // rule that guards the window-namespace convention these files rely on.
      sourceType: "script",
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
    // Tests run under vitest in Node and use ESM import syntax.
    files: ["tests/**/*.js"],
    languageOptions: {
      sourceType: "module",
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
    // This config is itself an ES module loaded by ESLint under Node.
    files: ["eslint.config.js"],
    languageOptions: { sourceType: "module", globals: {} }
  }
];
