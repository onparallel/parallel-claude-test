import type { StorybookConfig } from "@storybook/server-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.json"],
  logLevel: "debug",
  addons: ["@storybook/addon-a11y"],
  framework: "@storybook/server-webpack5",
};

export default config;
