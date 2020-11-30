declare namespace NodeJS {
  interface ProcessEnv {
    readonly BUILD_ID: string;
    readonly SERVER_TOKEN: string;
    readonly NEXT_PUBLIC_PARALLEL_URL: string;
    readonly NEXT_PUBLIC_ASSETS_URL: string;
    readonly NEXT_PUBLIC_LOG_GROUP: string;
    readonly NEXT_PUBLIC_AWS_REGION: string;
    readonly NEXT_PUBLIC_AWS_ACCESS_KEY_ID: string;
    readonly NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: string;
  }
}
