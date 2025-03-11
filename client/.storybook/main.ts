import type { StorybookConfig } from "@storybook/nextjs";

import { resolve } from "path";
const { merge } = require("webpack-merge");

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  framework: "@storybook/nextjs",
  addons: ["@storybook/addon-docs", "@storybook/addon-controls", "@storybook/addon-toolbars"],
  refs: {
    "@chakra-ui/react": {
      disable: true,
    },
  },
  typescript: {
    reactDocgen: "react-docgen",
  },
  webpackFinal: (config) => {
    const alias = {
      "@parallel": resolve(__dirname, ".."),
      "@emotion/core": "@emotion/core",
      "@emotion/styled": "@emotion/styled",
      "emotion-theming": "@emotion/react",
    };
    return merge(config, {
      resolve: {
        alias,
      },
    });
  },
};

module.exports = config;
