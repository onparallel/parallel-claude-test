declare namespace NodeJS {
  interface ProcessEnv {
    readonly BUILD_ID: string;
    readonly CLIENT_SERVER_TOKEN: string;
    readonly NEXT_PUBLIC_PARALLEL_URL: string;
    readonly NEXT_PUBLIC_ASSETS_URL: string;
    readonly NEXT_PUBLIC_ENVIRONMENT: string;
    readonly NEXT_PUBLIC_SENTRY_DSN: string;
    readonly NEXT_PUBLIC_SEGMENT_WRITE_KEY: string;
    readonly NEXT_PUBLIC_USERFLOW_TOKEN: string;
    readonly NEXT_PUBLIC_RECAPTCHA_SITE_KEY: string;
  }
}
