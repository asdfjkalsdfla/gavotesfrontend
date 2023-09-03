module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["prettier", "react"],
  rules: {
    "prettier/prettier": "error",
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "no-var": ["error"],
    eqeqeq: ["error"],
    "class-methods-use-this": ["off"],
    "max-classes-per-file": ["off"],
    "react/prop-types": ["off"],
    "import/no-extraneous-dependencies": ["off"],
    "lines-between-class-members": ["off"],
    "no-nested-ternary": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
