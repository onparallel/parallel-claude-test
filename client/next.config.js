/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const { createSecureHeaders } = require("next-secure-headers");

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
      new options.webpack.DefinePlugin({
        "process.env.BUILD_ID": JSON.stringify(options.buildId),
      })
    );

    if (
      process.env.NODE_ENV === "production" &&
      process.env.SENTRY_AUTH_TOKEN
    ) {
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
    return config;
  },
  async redirects() {
    return [
      {
        source: "/:locale/app",
        destination: "/:locale/app/petitions",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers:
          process.env.NODE_ENV === "production"
            ? createSecureHeaders({
                forceHTTPSRedirect: [
                  true,
                  { maxAge: 60 * 60 * 24 * 30, includeSubDomains: true },
                ],
                referrerPolicy: "same-origin",
                frameGuard: "sameorigin",
                xssProtection: "sanitize",
                nosniff: "nosniff",
                noopen: "noopen",
              })
            : [],
      },
    ];
  },
};

const plugins = [
  require("@next/bundle-analyzer")({
    enabled: Boolean(process.env.ANALYZE),
  }),
  require("next-plugin-graphql"),
  // source maps in last place, so it wraps every other plugin
  require("@zeit/next-source-maps")(),
];

module.exports = plugins.reduce((acc, curr) => curr(acc), config);
