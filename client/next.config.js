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
      })
    );

    if (process.env.NODE_ENV === "production" && !process.env.SKIP_SENTRY) {
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
                      "polyfill.io",
                      // Google analytics
                      "www.googletagmanager.com",
                      "www.google-analytics.com",
                      "googleads.g.doubleclick.net",
                      "www.google.com",
                      "www.googleadservices.com",
                      // Hotjar
                      "*.hotjar.com",
                      // Hubspot
                      "js.hs-scripts.com",
                      "js.hscollectedforms.net",
                      "js.hsleadflows.net",
                      "js.hsadspixel.net",
                      "js.hs-analytics.net",
                      "js.hs-banner.com",
                      "*.hsforms.net",
                      "*.hsforms.com",
                      "js.usemessages.com",
                      "static.hsappstatic.net",
                      "www.gstatic.com", // (recaptcha)
                    ],
                    connectSrc: [
                      "'self'",
                      "*.parallel.so",
                      // Google analytics
                      "www.google-analytics.com",
                      // Hotjar
                      "*.hotjar.com",
                      // Hubspot
                      "*.hubspot.com",
                      "*.hubapi.com",
                      "*.hsforms.com",
                      "hubspot-forms-static-embed.s3.amazonaws.com",
                    ],
                    styleSrc: [
                      "'self'",
                      "'unsafe-inline'",
                      "*.parallel.so",
                      "static.hsappstatic.net",
                      // Hubspot
                      "fonts.googleapis.com",
                    ],
                    imgSrc: [
                      "'self'",
                      "*.parallel.so",
                      // Google analytics
                      "www.google-analytics.com",
                      "www.googletagmanager.com",
                      "www.google.com",
                      "www.google.es",
                      // Hubspot
                      "*.hubspot.com",
                      "*.hsforms.com",
                    ],
                    frameSrc: [
                      "'self'",
                      "*.parallel.so",
                      // Hotjar
                      "vars.hotjar.com",
                      // Hubspot
                      "app.hubspot.com",
                      "forms.hsforms.com",
                      "www.google.com",
                    ],
                    fontSrc: [
                      "'self'",
                      "*.parallel.so",
                      // Hubspot
                      "fonts.gstatic.com",
                    ],
                  },
                },
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
