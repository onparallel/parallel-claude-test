module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "variable",
        format: ["PascalCase", "camelCase", "UPPER_CASE"],
        leadingUnderscore: "allow",
      },
      {
        selector: "parameter",
        format: ["camelCase"],
        leadingUnderscore: "allow",
      },
      {
        selector: "property",
        format: null,
      },
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        vars: "all",
        args: "none",
        ignoreRestSiblings: false,
      },
    ],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "formatjs/enforce-default-message": ["error", "literal"],
    "formatjs/enforce-placeholders": "error",
    "formatjs/no-multiple-whitespaces": "error",
  },
  plugins: ["formatjs", "prettier"],
  settings: {
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [
    "node_modules",
    "*/node_modules",
    "client/out",
    "client/.next",
    "server/dist",
    "bin/dist",
    "**/__*",
  ],
};
