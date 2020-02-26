const isProd = process.env.NODE_ENV === "production";
module.exports = {
  env: {
    ROOT: __dirname
  },
  assetPrefix: isProd ? "https://static.parallel.so" : "",
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
  }
};
