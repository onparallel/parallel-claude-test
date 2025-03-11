import type { StorybookConfig } from "@storybook/server-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.json"],
  logLevel: "debug",
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-controls",
    "@storybook/addon-a11y",
    "@storybook/addon-toolbars",
  ],
  core: {
    disableTelemetry: true,
  },
  features: {
    storyStoreV7: false,
  },
  framework: "@storybook/server-webpack5",
};

module.exports = config;
