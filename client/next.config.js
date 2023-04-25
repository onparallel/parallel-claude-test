/* eslint-disable @typescript-eslint/no-var-requires */
const { createSecureHeaders } = require("next-secure-headers");

/** @type {import('next').NextConfig} */
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
  generateBuildId: process.env.BUILD_ID ? () => process.env.BUILD_ID : undefined,
  crossOrigin: "anonymous",
  assetPrefix: process.env.NEXT_PUBLIC_ASSETS_URL,
  poweredByHeader: false,
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
    config.resolve.alias["react/jsx-runtime"] = "react/jsx-runtime.js";
    config.plugins.push(
      new options.webpack.DefinePlugin({ "process.env.BUILD_ID": JSON.stringify(options.buildId) })
    );

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
              forceHTTPSRedirect: false, // this is set on nginx
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
      { source: "/invite", destination: "/signup", permanent: true },
      { source: "/app/settings/tokens", destination: "/app/settings/developers", permanent: true },
      {
        source: "/app/admin/organizations/:organizationId",
        destination: "/app/admin/organizations/:organizationId/users",
        permanent: false,
      },
      {
        source: "/petition/:keycode/opt-out",
        destination: "/petition/:keycode/reminders",
        permanent: true,
      },
    ];
  },
  sentry: {
    hideSourceMaps: true,
  },
  experimental: {
    largePageDataBytes: 0.5 * 1024 * 1024,
  },
};

module.exports = [
  require("@next/bundle-analyzer")({ enabled: Boolean(process.env.ANALYZE) }),
  require("next-plugin-graphql"),
  ...(process.env.SENTRY_AUTH_TOKEN
    ? [
        (config) =>
          require("@sentry/nextjs")(
            config,
            { silent: true, org: "parallel-org", project: "parallel" },
            {
              widenClientFileUpload: true,
              transpileClientSDK: true,
              hideSourceMaps: true,
            }
          ),
      ]
    : [({ sentry, ...config }) => config]),
].reduce((acc, curr) => curr(acc), config);
