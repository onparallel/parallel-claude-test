import type { StorybookConfig } from "@storybook/nextjs";

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { merge } from "webpack-merge";

// Get the directory name from the URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export default config;