import { DocumentContext } from "next/document";

const REPORT_ONLY = true;
const HEADER = REPORT_ONLY ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";

export function csp(ctx: DocumentContext, nonce: string) {
  if (process.env.NODE_ENV === "development") {
    return;
  }
  const statics = (process.env.NEXT_PUBLIC_ASSETS_URL ?? "").replace("https://", "");
  const uploads = `parallel-file-uploads-${process.env.NEXT_PUBLIC_ENVIRONMENT}.s3-accelerate.amazonaws.com`;
  const tempUploads = `parallel-temporary-files-${process.env.NEXT_PUBLIC_ENVIRONMENT}.s3-accelerate.amazonaws.com`;
  if (ctx.pathname === "/app" || ctx.pathname.startsWith("/app/")) {
    ctx.res?.setHeader(
      HEADER,
      buildPolicy([
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
          statics,
          `'unsafe-inline'`,
          "js.userflow.com",
          "fonts.googleapis.com", // userflow
        ],
        [
          "script-src",
          "'self'",
          `'nonce-${nonce}'`,
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
          tempUploads,
          "*.segment.com",
          "*.segment.io",
          "*.canny.io",
          "*.intercom.io",
          "wss://*.intercom.io",
          "*.userflow.com",
          "wss://*.userflow.com",
          "px.ads.linkedin.com",
          "*.google-analytics.com",
          "localhost:50500", // Cuatrecasas integration
        ],
        ["worker-src", "'self'", statics],
        ["frame-src", "'self'", "canny.io", "changelog-widget.canny.io"],
        ["font-src", "'self'", statics, "fonts.gstatic.com", "fonts.intercomcdn.com"],
        [
          "report-uri",
          `https://o488034.ingest.us.sentry.io/api/5547679/security/?${new URLSearchParams({
            sentry_key: "9b8d902a0e064afeb5e6c1c45086aea1",
            sentry_environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
            sentry_release: process.env.BUILD_ID,
          })}`,
        ],
      ]),
    );
  } else if (
    ["/maintenance", "/thanks", "/update", "/404"].includes(ctx.pathname) ||
    ["/petition/", "/pp/"].some((prefix) => ctx.pathname.startsWith(prefix))
  ) {
    ctx.res?.setHeader(
      HEADER,
      buildPolicy([
        ["default-src", "'self'", statics],
        ["img-src", "*"],
        ["style-src", "'self'", "'unsafe-inline'", statics],
        ["script-src", "'self'", `'nonce-${nonce}'`, statics, "cdnjs.cloudflare.com"],
        ["connect-src", "'self'", statics, uploads],
      ]),
    );
  } else if (ctx.pathname === "/developers/api") {
    ctx.res?.setHeader(
      HEADER,
      buildPolicy([
        ["default-src", "'self'", statics],
        ["img-src", "'self'", statics, "data:", "cdn.redoc.ly"],
        ["style-src", "'self'", statics, "'unsafe-inline'"],
        ["script-src", "'self'", `'nonce-${nonce}'`, statics, "cdnjs.cloudflare.com"],
        ["worker-src", "'self'", statics, "blob:"],
      ]),
    );
  }
}

function buildPolicy(directives: string[][]) {
  return directives.map((directive) => directive.join(" ")).join("; ");
}
