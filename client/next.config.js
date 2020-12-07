/* eslint-disable @typescript-eslint/no-var-requires */
const { DefinePlugin } = require("webpack");
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
      new DefinePlugin({
        "process.env.BUILD_ID": JSON.stringify(options.buildId),
        "process.env.NEXT_IS_SERVER": JSON.stringify(options.isServer),
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers:
          process.env.NODE_ENV === "production"
            ? createSecureHeaders({
                contentSecurityPolicy: {
                  directives: {
                    defaultSrc: ["'self'", "*.parallel.so"],
                    scriptSrc: [
                      "'self'",
                      "*.parallel.so",
                      "https://polyfill.io",
                      // Google analytics
                      "https://www.googletagmanager.com",
                      "https://www.google-analytics.com",
                      "https://googleads.g.doubleclick.net",
                      // Hotjar
                      "https://script.hotjar.com",
                      // Hubspot
                      "https://js.hs-scripts.com",
                      "https://js.hscollectedforms.net",
                      "https://js.hsleadflows.net",
                      "https://js.hsadspixel.net",
                      "https://js.hs-analytics.net",
                      "https://js.hs-banner.com",
                      "https://js.usemessages.com",
                      "https://static.hsappstatic.net",
                    ],
                    styleSrc: [
                      "'self'",
                      "'unsafe-inline'",
                      "*.parallel.so",
                      "https://static.hsappstatic.net",
                    ],
                    imgSrc: [
                      "'self'",
                      "*.parallel.so",
                      "https://www.googletagmanager.com",
                      "https://track.hubspot.com",
                      "https://www.google.com",
                      "https://www.google.es",
                    ],
                  },
                },
                forceHTTPSRedirect: [
                  true,
                  { maxAge: 60 * 60 * 24 * 30, includeSubDomains: true },
                ],
                referrerPolicy: "same-origin",
              })
            : [],
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
