/* eslint-disable @typescript-eslint/no-var-requires */
const PROD = process.env.NODE_ENV === "production";
const assetsUrl = PROD
  ? {
      staging: "https://static-staging.parallel.so",
      production: "https://static.parallel.so",
    }[process.env.ENV] || ""
  : "";
const config = {
  env: {
    ROOT: __dirname,
    ASSETS_URL: assetsUrl,
  },
  crossOrigin: "anonymous",
  assetPrefix: assetsUrl,
  poweredByHeader: false,
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
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
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      "/": { page: "/" },
    };
  },
};

const plugins = [
  require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  }),
];

module.exports = plugins.reduce((acc, curr) => curr(acc), config);
