// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.BUILD_ID,
  debug: false,
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  normalizeDepth: 7,
  // Enable logs to be sent to Sentry
  enableLogs: true,
  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
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
    /**
     * Ignore userflow infinite errors
     */
    "UserflowError: This Userflow.js client has reached a maximum of 100 operations in the last 1 minute",
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
