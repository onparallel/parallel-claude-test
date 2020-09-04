// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".test.env" : ".env",
});

export const development = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT!),
  },
  migrations: {
    directory: "migrations",
    tableName: "migrations",
    extension: "ts",
  },
  seeds: {
    directory: "seeds",
    extension: "ts",
  },
};

export const test = development;

export const staging = {
  client: "pg",
  connection: {
    host: "parallel-staging.cawlvk8lltxr.eu-central-1.rds.amazonaws.com",
    database: "parallel",
    user: "parallel_ops",
    password: process.env.DB_PASSWORD,
    port: 5432,
  },
  migrations: {
    directory: "migrations",
    tableName: "migrations",
    extension: "ts",
  },
  seeds: {
    directory: "seeds",
    extension: "ts",
  },
};

export const production = {
  client: "pg",
  connection: {
    host: "parallel-production.cawlvk8lltxr.eu-central-1.rds.amazonaws.com",
    database: "parallel",
    user: "parallel_ops",
    password: process.env.DB_PASSWORD,
    port: 5432,
  },
  migrations: {
    directory: "migrations",
    tableName: "migrations",
    extension: "ts",
  },
  seeds: {
    directory: "seeds",
    extension: "ts",
  },
};
