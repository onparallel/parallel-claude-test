import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";

export function initSentry() {
  Sentry.init({
    enabled: process.env.NODE_ENV === "production",
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    integrations:
      typeof window === "undefined"
        ? [
            // For Node.js, rewrite Error.stack to use relative paths, so that source
            // maps starting with ~/_next map to files in Error.stack with path app:///_next
            new RewriteFrames({
              iteratee: (frame) => {
                frame.filename = frame
                  .filename!.replace(process.env.ROOT!, "app:///")
                  .replace(".next", "_next");
                return frame;
              },
            }),
          ]
        : [],
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    release: process.env.BUILD_ID,
  });
}
