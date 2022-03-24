const path = require("path");
const { merge } = require("webpack-merge");

module.exports = {
  stories: ["../stories/**/*.stories.tsx"],
  framework: "@storybook/react",
  addons: ["@storybook/addon-docs", "@storybook/addon-controls", "@storybook/addon-toolbars"],
  refs: {
    "@chakra-ui/react": {
      disable: true,
    },
  },
  typescript: { reactDocgen: "react-docgen" },
  webpackFinal: (config) => {
    const alias = {
      "@parallel": path.resolve(__dirname, ".."),
      "@emotion/core": "@emotion/core",
      "@emotion/styled": "@emotion/styled",
      "emotion-theming": "@emotion/react",
    };
    return merge(config, { resolve: { alias } });
  },
};
