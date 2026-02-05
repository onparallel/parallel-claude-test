/** @type {import('next').NextConfig} */
const config = {
  env: {
    ROOT: __dirname,
  },
  i18n: {
    locales: ["en", "es", "ca", "it", "pt"],
    defaultLocale: "en",
  },
  devIndicators: {
    position: "bottom-right",
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

    // Exclude Node.js built-in modules from client bundle
    // jsdom requires these but they don't exist in the browser
    if (!options.isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        dns: false,
        http2: false,
        module: false,
        perf_hooks: false,
        readline: false,
        stream: false,
        util: false,
        zlib: false,
      };
    }

    // Add the why did you render script on development
    // NOTE: Temporarily disabled for React 19 compatibility
    // why-did-you-render v8.0.3 is not compatible with React 19 (ReactCurrentOwner was removed)
    // Re-enable when why-did-you-render is updated for React 19 support
    // const originalEntry = config.entry;
    // config.entry = async () => {
    //   const entries = await originalEntry();
    //   const main = entries["main.js"];
    //   if (options.dev && !options.isServer) {
    //     const script = "./build/why-did-you-render.js";
    //     if (main && !main.includes(script)) {
    //       main.unshift(script);
    //     }
    //   }
    //   return entries;
    // };

    // Suppress Prisma/OpenTelemetry dynamic require warning
    // This is a known issue with @prisma/instrumentation and doesn't affect functionality
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /@prisma\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

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
            headers: [
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
    swcPlugins:
      process.env.NODE_ENV === "production"
        ? [
            [
              "@swc/plugin-formatjs",
              {
                removeDefaultMessage: true,
              },
            ],
          ]
        : [],
  },
  transpilePackages: ["pdfjs-dist"],
  turbopack: {
    resolveAlias: {
      "@parallel": __dirname,
      // Use no-parser version of formatjs in production to reduce bundle size
      ...(process.env.NODE_ENV === "production"
        ? { "@formatjs/icu-messageformat-parser": "@formatjs/icu-messageformat-parser/no-parser" }
        : {}),
    },
  },
  compiler: {
    // Use SWC for Emotion instead of Babel (much faster)
    emotion: {
      // Enable source maps in development
      sourceMap: process.env.NODE_ENV === "development",
      // Auto-label in development only
      autoLabel: "dev-only",
      // Label format
      labelFormat: "[local]",
    },
  },
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
            sourcemaps: {
              deleteSourcemapsAfterUpload: true,
            },
          }),
      ]
    : []),
].reduce((acc, curr) => curr(acc), config);
