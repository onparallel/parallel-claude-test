/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const { createSecureHeaders } = require("next-secure-headers");

const config = {
  env: {
    ROOT: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
  },
  crossOrigin: "anonymous",
  assetPrefix: process.env.NEXT_PUBLIC_ASSETS_URL,
  poweredByHeader: false,
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
    config.plugins.push(
      new options.webpack.DefinePlugin({
        "process.env.BUILD_ID": JSON.stringify(options.buildId),
      })
    );

    // Configure sentry
    if (!options.isServer) {
      config.resolve.alias["@sentry/node"] = "@sentry/browser";
    }
    if (process.env.NODE_ENV === "production" && process.env.SENTRY_AUTH_TOKEN) {
      config.plugins.push(
        new SentryWebpackPlugin({
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: "parallel-org",
          project: "parallel",
          include: ".next",
          ignore: ["node_modules"],
          stripPrefix: ["webpack://_N_E/"],
          urlPrefix: `~/_next`,
          release: options.buildId,
        })
      );
    }

    // Add the why did you render script on development
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      const main = entries["main.js"];
      if (options.dev && !options.isServer) {
        const script = "./build/why-did-you-render.js";
        if (main && !main.includes(script)) {
          main.unshift(script);
        }
      }
      return entries;
    };

    // Configure formatjs to not include the parser on production
    if (process.env.NODE_ENV === "production") {
      config.resolve.alias["@formatjs/icu-messageformat-parser"] =
        "@formatjs/icu-messageformat-parser/no-parser";
    }

    return config;
  },
  async headers() {
    return process.env.NODE_ENV === "production"
      ? [
          {
            source: "/(.*)",
            headers: createSecureHeaders({
              forceHTTPSRedirect: [true, { maxAge: 60 * 60 * 24 * 30, includeSubDomains: true }],
              referrerPolicy: "same-origin",
              frameGuard: "sameorigin",
              xssProtection: "sanitize",
              nosniff: "nosniff",
              noopen: "noopen",
            }),
          },
        ]
      : [];
  },
  redirects() {
    return [
      { source: "/app/settings/tokens", destination: "/app/settings/developers", permanent: true },
    ];
  },
  productionBrowserSourceMaps: true,
};

module.exports = [
  require("@next/bundle-analyzer")({ enabled: Boolean(process.env.ANALYZE) }),
  require("next-plugin-graphql"),
].reduce((acc, curr) => curr(acc), config);
