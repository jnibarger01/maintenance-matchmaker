import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        window: "readonly"
      }
    },
    rules: {
      "no-var": "error"
    }
  },
  {
    files: ["ui.js"],
    languageOptions: {
      globals: {
        alert: "readonly",
        document: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        console: "readonly"
      }
    }
  },
  {
    files: ["validation.js"],
    languageOptions: {
      globals: {
        module: "readonly"
      }
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        vi: "readonly",
        process: "readonly"
      }
    }
  }
];
