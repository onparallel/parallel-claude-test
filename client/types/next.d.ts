declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_ASSETS_URL: string;
    readonly BUILD_ID: string;
  }
}
