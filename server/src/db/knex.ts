import { readFileSync } from "fs";
import { createTaggedDecorator, interfaces } from "inversify";
import { Knex, knex } from "knex";
import pg from "pg";
import { parse } from "postgres-interval";
import { hrtime } from "process";
import { isNonNullish } from "remeda";
import { CONFIG, Config } from "../config";
import { ILogger, LOGGER } from "../services/Logger";
import { TableTypes } from "./__types";
import "./helpers/knexExtensions";

pg.types.setTypeParser(pg.types.builtins.INTERVAL, (value: string) => {
  const { milliseconds, seconds, ...rest } = parse(value);
  if (isNonNullish(seconds) || isNonNullish(milliseconds)) {
    return {
      ...rest,
      seconds: (seconds ?? 0) + (milliseconds ?? 0) / 1000,
    };
  }
  return rest;
});

// don't parse Date objects
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => parseFloat(value));

export const KNEX = Symbol.for("KNEX");

export const readOnly = createTaggedDecorator({ key: "db", value: "read-only" });

declare module "knex/types/tables" {
  interface Tables extends TableTypes {}
}

export function createKnex(mode: keyof Config["db"]) {
  return function ({ container }: interfaces.Context): Knex {
    const config = container.get<Config>(CONFIG);
    const logger = container.get<ILogger>(LOGGER);
    const connection = config.db[mode];
    const instance = knex({
      client: "pg",
      // https://github.com/knex/knex/issues/5648
      connection: {
        ...connection,
        ssl:
          process.env.NODE_ENV === "production"
            ? {
                rejectUnauthorized: true,
                // downloaded from https://truststore.pki.rds.amazonaws.com/eu-central-1/eu-central-1-bundle.pem
                // more info in https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html
                ca: readFileSync(__dirname + "/../../eu-central-1-bundle.pem").toString(),
              }
            : undefined,
      },
      asyncStackTraces: process.env.NODE_ENV !== "production",
      pool: {
        min: 5,
        max: connection.maxConnections,
      },
    });
    if (process.env.NODE_ENV === "development") {
      const times: Record<string, ReturnType<typeof process.hrtime>> = {};
      instance
        .on("query", (query) => {
          times[query.__knexQueryUid] = hrtime();
        })
        .on("query-response", (_, query) => {
          const [seconds, nanoseconds] = process.hrtime(times[query.__knexQueryUid]);
          delete times[query.__knexQueryUid];
          const time = seconds * 1000 + Math.round(nanoseconds / 1e6);
          logger.debug(query.sql, { bindings: query.bindings, time });
        });
    }
    return instance as any;
  };
}
