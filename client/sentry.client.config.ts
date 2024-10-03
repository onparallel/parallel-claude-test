import * as Sentry from "@sentry/nextjs";

Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.BUILD_ID,
  debug: false,
  tracesSampleRate: 1,
  normalizeDepth: 7,
  ignoreErrors: [
    /**
     * There is a bug in Safari, that causes `AbortError` when fetch is  aborted, and you are in
     * the middle of reading the response. In Chrome and others it's handled gracefully.
     *
     * Ref: https://bugs.webkit.org/show_bug.cgi?id=215771
     */
    "AbortError: Fetch is aborted",
    /**
     * Cancel errors coming from preventing a navigation change in usePreventNavigation
     */
    "CANCEL_ROUTE_CHANGE",
    /**
     * Ignore these Next.js errors
     */
    "TypeError: Failed to fetch",
  ],
});
