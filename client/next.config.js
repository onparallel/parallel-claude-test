/* eslint-disable @typescript-eslint/no-var-requires */
const config = {
  env: {
    ROOT: __dirname,
  },
  crossOrigin: "anonymous",
  assetPrefix: process.env.NEXT_PUBLIC_ASSETS_URL,
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
];

module.exports = plugins.reduce((acc, curr) => curr(acc), config);
