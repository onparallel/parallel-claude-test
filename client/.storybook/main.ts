import type { StorybookConfig } from "@storybook/nextjs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { merge } from "webpack-merge";

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = dirname(currentFilename);

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  framework: "@storybook/nextjs",
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
      "@parallel": resolve(currentDirname, ".."),
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
