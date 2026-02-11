import * as Sentry from "@sentry/nextjs";

Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.BUILD_ID,
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
  debug: false,
});
