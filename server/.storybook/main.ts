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
  framework: {
    name: "@storybook/server-webpack5",
    options: {},
  },
  docs: {
    autodocs: true,
  },
};

export default config;
