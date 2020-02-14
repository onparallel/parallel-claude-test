module.exports = {
  env: {
    ROOT: __dirname
  },
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
    return config;
  }
};
