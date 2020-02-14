require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? ".test.env" : ".env"
});

export const development = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT!)
  },
  asyncStackTraces: true,
  pool: {
    min: 2,
    max: parseInt(process.env.DB_MAX_CONNECTIONS!)
  },
  migrations: {
    directory: "migrations",
    tableName: "migrations",
    extension: "ts"
  },
  seeds: {
    directory: "seeds",
    extension: "ts"
  }
};

export const test = development;
