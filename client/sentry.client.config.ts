import * as Sentry from "@sentry/nextjs";

Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.BUILD_ID,
  debug: false,
  tracesSampleRate: 1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
