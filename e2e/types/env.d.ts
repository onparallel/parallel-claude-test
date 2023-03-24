declare namespace NodeJS {
  interface ProcessEnv extends UserEnvs {
    readonly BASE_URL: string;

    readonly IMAP_USER: string;
    readonly IMAP_PASSWORD: string;

    readonly TEMPLATE1_ID: string;
  }
}

type UserEnvs = Readonly<Record<`USER${1 | 2}_${"EMAIL" | "PASSWORD"}`, string>>;
