import { fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import formatjsPlugin from "eslint-plugin-formatjs";
import prettier from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {},
    },

    extends: compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "prettier",
    ),

    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }],

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
          vars: "all",
          varsIgnorePattern: "^_",
          args: "none",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: false,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      eqeqeq: ["error", "always"],

      "react/react-in-jsx-scope": "off",
      "react/display-name": "off",
      "react/prop-types": "off",

      "formatjs/enforce-default-message": ["error", "literal"],
      "formatjs/enforce-placeholders": ["error", { ignoreList: ["b", "tone"] }],
      "formatjs/no-multiple-whitespaces": "error",
      "formatjs/no-complex-selectors": ["error", { limit: 12 }],

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@chakra-ui/react",
              importNames: ["useMergeRefs", "CloseButton", "Tooltip", "Menu", "Popover", "Select"],
              message:
                'Please use instead useMergedRef from "@react-hook/merged-ref", CloseButton from "@parallel/common/CloseButton", Menu, Popover, Select and Tooltip from "@parallel/chakra/components"',
            },
            {
              name: "@chakra-ui/react",
              importNames: [
                "Collapse",
                "Accordion",
                "AccordionPanel",
                "AccordionItem",
                "AccordionButton",
                "AccordionIcon",
                "PinInput",
                "PinInputField",
                "Avatar",
                "AvatarBadge",
                "AvatarGroup",
                "AvatarImage",
                "AvatarFallback",
                "Text",
                "Button",
              ],
              message:
                'Please use the Chakra V3 compatible components from "@parallel/components/ui" instead of "@chakra-ui/react"',
            },
            {
              name: "assert",
              message: 'Please use assert from "ts-essentials" instead.',
            },
            {
              name: "console",
              importNames: ["assert"],
              message: 'Please use assert from "ts-essentials" instead.',
            },
            {
              name: "remeda",
              importNames: [
                "compact",
                "countBy",
                "flatMapToObj",
                "flatten",
                "flattenDeep",
                "isObject",
                "maxBy",
                "minBy",
                "noop",
                "reject",
                "type",
                "zipObj",
                "createPipe",
                "equals",
                "fromPairs",
                "isNil",
                "toPairs",
                "uniqBy",
                "uniqWith",
              ],
              message: "Use upgrade OK version https://remedajs.com/migrate/v1",
            },
          ],
        },
      ],
    },

    plugins: {
      formatjs: fixupPluginRules(formatjsPlugin),
      prettier,
    },

    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    // Client-specific overrides
    files: ["client/**/*.ts", "client/**/*.tsx", "client/**/*.js", "client/**/*.jsx"],

    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "formatjs/enforce-id": [
        "warn",
        {
          idWhitelist: [
            "^generic\\.[a-z0-9-]+[a-z0-9]$",
            "^(component|page|util)(\\.[a-z0-9-]+[a-z0-9]){2}$",
          ],
          idInterpolationPattern: "*",
        },
      ],
      "formatjs/no-literal-string-in-jsx": [
        "error",
        {
          props: {
            include: [
              ["*", "title"],
              ["*", "placeholder"],
              ["*", "aria-label"],
              ["*", "label"],
              ["*", "description"],
              ["*", "alt"],
            ],
          },
        },
      ],

      "react/forbid-component-props": [
        "error",
        {
          forbid: [
            ...["margin", "padding", "border"].flatMap((p) => [
              {
                propName: `${p}Left`,
                message: `Use ${p}Start instead for better rtl support`,
              },
              {
                propName: `${p}Right`,
                message: `Use ${p}End instead for better rtl support`,
              },
            ]),
            {
              propName: `left`,
              message: `Use insetStart instead for better rtl support`,
            },
            {
              propName: `right`,
              message: `Use insetEnd instead for better rtl support`,
            },
          ],
        },
      ],
    },
  },
  {
    // Allow require() in JavaScript files that use CommonJS
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    "**/node_modules",
    "*/node_modules",
    "client/out",
    "client/.next",
    "client/public",
    "server/dist",
    "bin/dist",
    "**/__*.ts",
    "client/public/static/lang",
    "server/lang/compiled",
    "eslint.config.mjs",
  ]),
]);
