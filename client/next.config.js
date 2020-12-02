/* eslint-disable @typescript-eslint/no-var-requires */
const { DefinePlugin } = require("webpack");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

const config = {
  env: {
    ROOT: __dirname,
  },
  crossOrigin: "anonymous",
  assetPrefix: process.env.NEXT_PUBLIC_ASSETS_URL,
  poweredByHeader: false,
  webpack(config, options) {
    if (!options.isServer) {
      config.resolve.alias["@sentry/node"] = "@sentry/browser";
    }

    config.resolve.alias["@parallel"] = __dirname;
    config.plugins.push(
      new DefinePlugin({
        "process.env.BUILD_ID": JSON.stringify(options.buildId),
        "process.env.NEXT_IS_SERVER": JSON.stringify(
          options.isServer.toString()
        ),
      })
    );

    if (process.env.NODE_ENV === "production") {
      config.plugins.push(
        new SentryWebpackPlugin({
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: "parallel-so",
          project: "parallel",
          include: ".next",
          ignore: ["node_modules"],
          stripPrefix: ["webpack://_N_E/"],
          urlPrefix: `~/_next`,
          release: options.buildId,
        })
      );
    }
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      const main = entries["main.js"];
      for (const { src, dev, isServer } of [
        { src: "./build/why-did-you-render.js", dev: true, isServer: false },
      ]) {
        if (
          (dev === undefined || dev === options.dev) &&
          (isServer === undefined || isServer === options.isServer)
        ) {
          if (main && !main.includes(src)) {
            main.unshift(src);
          }
        }
      }
      return entries;
    };
    return config;
  },
  exportPathMap: async function () {
    return {
      "/": { page: "/" },
    };
  },
  async redirects() {
    return [
      {
        source: "/:locale/app",
        destination: "/:locale/app/petitions",
        permanent: false,
      },
      {
        source: "/:locale/petition/:keycode",
        destination: "/:locale/petition/:keycode/1",
        permanent: false,
      },
    ];
  },
};

const plugins = [
  require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  }),
  require("next-plugin-graphql"),
  // source maps in last place, so it wraps every other plugin
  require("@zeit/next-source-maps")(),
];

module.exports = plugins.reduce((acc, curr) => curr(acc), config);
