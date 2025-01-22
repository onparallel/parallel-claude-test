/* eslint-disable @typescript-eslint/no-var-requires */

/** @type {import('next').NextConfig} */
const config = {
  env: {
    ROOT: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n: {
    locales: ["en", "es", "ca", "it", "pt"],
    defaultLocale: "en",
  },
  generateBuildId: process.env.BUILD_ID ? () => process.env.BUILD_ID : undefined,
  crossOrigin: "anonymous",
  assetPrefix: process.env.NEXT_PUBLIC_ASSETS_URL,
  poweredByHeader: false,
  webpack(config, options) {
    config.resolve.alias["@parallel"] = __dirname;
    config.plugins.push(
      new options.webpack.DefinePlugin({ "process.env.BUILD_ID": JSON.stringify(options.buildId) }),
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
    const statics = (process.env.NEXT_PUBLIC_ASSETS_URL ?? "").replace("https://", "");
    const uploads = `parallel-file-uploads-${process.env.NEXT_PUBLIC_ENVIRONMENT}.s3-accelerate.amazonaws.com`;
    return process.env.NODE_ENV === "production"
      ? [
          {
            source: "/(.*)",
            headers: [
              {
                key: "Content-Security-Policy-Report-Only",
                value: [
                  ["default-src", "'self'", statics],
                  ["img-src", "*"],
                  [
                    "media-src",
                    "*",
                    "'self'",
                    "js.intercomcdn.com", // needed for intercom sounds
                  ],
                  [
                    "style-src",
                    "'self'",
                    "'unsafe-inline'",
                    statics,
                    "js.userflow.com",
                    "fonts.googleapis.com", // userflow
                  ],
                  [
                    "script-src",
                    "'self'",
                    "'unsafe-inline'",
                    statics,
                    "cdnjs.cloudflare.com",
                    "cdn.segment.com",
                    "canny.io",
                    "js.userflow.com",
                    "widget.intercom.io",
                    "js.intercomcdn.com",
                    "www.googletagmanager.com",
                    "snap.licdn.com",
                    "px.ads.linkedin.com",
                  ],
                  [
                    "connect-src",
                    "'self'",
                    statics,
                    uploads,
                    "*.segment.com",
                    "*.segment.io",
                    "*.canny.io",
                    "*.intercom.io",
                    "wss://*.intercom.io",
                    "*.userflow.com",
                    "wss://*.userflow.com",
                    "px.ads.linkedin.com",
                    "localhost:50500", // Cuatrecasas integration
                  ],
                  ["frame-src", "'self'", "changelog-widget.canny.io"],
                  ["font-src", "'self'", statics, "fonts.gstatic.com", "fonts.intercomcdn.com"],
                  [
                    "report-uri",
                    `https://o488034.ingest.us.sentry.io/api/5547679/security/?${new URLSearchParams(
                      {
                        sentry_key: "9b8d902a0e064afeb5e6c1c45086aea1",
                        sentry_environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
                        sentry_release: process.env.BUILD_ID,
                      },
                    )}`,
                  ],
                ]
                  .map((directive) => directive.join(" "))
                  .join("; "),
              },
              { key: "X-Frame-Options", value: "sameorigin" },
              { key: "X-Download-Options", value: "noopen" },
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "Referrer-Policy", value: "same-origin" },
              { key: "X-XSS-Protection", value: "1" },
              {
                key: "Permissions-Policy",
                value:
                  "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
              },
            ],
          },
        ]
      : [];
  },
  redirects() {
    return [
      { source: "/signup", destination: "/login", permanent: false },
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
      {
        source: "/app/profiles/:profileId",
        destination: "/app/profiles/:profileId/general",
        permanent: false,
      },
    ];
  },
  experimental: {
    largePageDataBytes: 0.5 * 1024 * 1024,
  },
  transpilePackages: ["pdfjs-dist"],
};

module.exports = [
  require("@next/bundle-analyzer")({ enabled: Boolean(process.env.ANALYZE) }),
  require("next-plugin-graphql"),
  ...(process.env.SENTRY_AUTH_TOKEN
    ? [
        (config) =>
          require("@sentry/nextjs").withSentryConfig(config, {
            silent: true,
            org: "parallel-org",
            project: "parallel",
            widenClientFileUpload: true,
            tunnelRoute: "/monitoring",
            hideSourceMaps: true,
            disableLogger: true,
            deleteSourcemapsAfterUpload: true,
          }),
      ]
    : []),
].reduce((acc, curr) => curr(acc), config);
