import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import esPrettier from "eslint-plugin-prettier";
import esReact from "eslint-plugin-react";
import esReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // esPrettier.configs.recommended,
  // esTsRules.configs.react,
  {
    files: ["src/**/*.js","src/**/*.jsx","src/**/*.ts"],
    plugins: {
      prettier: esPrettier,
      react: esReact,
      "react-hooks": esReactHooks
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },
    // extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react/recommended", "plugin:react-hooks/recommended", "prettier"],
    
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
  },
);
