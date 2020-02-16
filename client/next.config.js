const isProd = process.env.NODE_ENV === "production";
module.exports = {
  env: {
    ROOT: __dirname
  },
  assetPrefix: isProd ? "https://static.parallel.so" : "",
  poweredByHeader: false,
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
    return config;
  }
};
