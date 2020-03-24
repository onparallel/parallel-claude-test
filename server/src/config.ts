export const CONFIG = Symbol.for("CONFIG");

export type Config = {
  readonly db: Readonly<{
    host: string;
    database: string;
    user: string;
    password: string;
    port: number;
    maxConnections: number;
  }>;
  readonly cognito: Readonly<{
    clientId: string;
    defaultPoolId: string;
  }>;
  readonly redis: Readonly<{
    host: string;
    password: string;
    port: number;
  }>;
};

export const config = Object.freeze({
  db: Object.freeze({
    host: process.env.DB_HOST!,
    database: process.env.DB_DATABASE!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    port: parseInt(process.env.DB_PORT!),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS!),
  }),
  cognito: Object.freeze({
    clientId: process.env.COGNITO_CLIENT_ID!,
    defaultPoolId: process.env.COGNITO_DEFAULT_POOL_ID!,
  }),
  redis: Object.freeze({
    host: process.env.REDIS_HOST!,
    password: process.env.REDIS_PASSWORD!,
    port: parseInt(process.env.REDIS_PORT!),
  }),
});
