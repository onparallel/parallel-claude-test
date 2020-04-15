const PROD = process.env.NODE_ENV === "production";
const config = {
  env: {
    ROOT: __dirname,
    GA_TRACKING_ID: process.env.ENV === "production" ? "UA-153451031-3" : null,
  },
  assetPrefix: PROD
    ? {
        staging: "https://static-staging.parallel.so",
        production: "https://static.parallel.so",
      }[process.env.ENV]
    : "",
  poweredByHeader: false,
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      if (options.dev && !options.isServer) {
        if (
          entries["main.js"] &&
          !entries["main.js"].includes("./build/why-did-you-render.js")
        ) {
          entries["main.js"].unshift("./build/why-did-you-render.js");
        }
      }
      return entries;
    };
    return config;
  },
};

const plugins = [
  require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
  }),
];

module.exports = plugins.reduce((acc, curr) => curr(acc), config);
