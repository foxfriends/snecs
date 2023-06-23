module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  reportUnusedDisableDirectives: true,
  parserOptions: {
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
  plugins: ["@typescript-eslint", "import"],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json",
      },
    },
  },
  env: {
    node: true,
    es2021: true,
  },
  globals: {
    Colony: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  rules: {
    "no-console": "error",
    "id-denylist": ["error", "idx"],
    "dot-notation": "error",
    "spaced-comment": "error",
    "prefer-template": "error",
    "prefer-const": "error",
    "no-var": "error",
    "no-useless-return": "error",
    "no-useless-rename": "error",
    "no-useless-computed-key": "error",
    "no-else-return": "error",
    "no-alert": "error",
    "no-undef": "error",
    "no-lonely-if": "error",
    "no-nested-ternary": "error",
    "object-shorthand": "error",
    yoda: "warn",
    eqeqeq: "error",
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "default",
        format: null,
      },
      {
        selector: "enumMember",
        format: ["StrictPascalCase"],
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { varsIgnorePattern: "^_.*", argsIgnorePattern: "^_.*" },
    ],
  },
};
