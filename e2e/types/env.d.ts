declare namespace NodeJS {
  interface ProcessEnv {
    readonly BASE_URL: string;

    readonly USER1_EMAIL: string;
    readonly USER1_PASSWORD: string;
    readonly USER1_IMAP_PASSWORD: string;

    readonly TEMPLATE1_ID: string;
  }
}
