import { createTaggedDecorator, interfaces } from "inversify";
import { Knex, knex } from "knex";
import { CONFIG, Config } from "../config";
import { ILogger, LOGGER } from "../services/Logger";
import "./helpers/knexExtensions";
import { TableTypes } from "./__types";
import pg from "pg";
import { parse } from "postgres-interval";
import { isDefined } from "remeda";

pg.types.setTypeParser(pg.types.builtins.INTERVAL, (value: string) => {
  const { milliseconds, seconds, ...rest } = parse(value);
  if (isDefined(seconds) || isDefined(milliseconds)) {
    return {
      ...rest,
      seconds: (seconds ?? 0) + (milliseconds ?? 0) / 1000,
    };
  }
  return rest;
});

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
      connection,
      asyncStackTraces: process.env.NODE_ENV !== "production",
      pool: {
        min: 5,
        max: connection.maxConnections,
      },
    });
    if (process.env.NODE_ENV === "development") {
      instance.on("query", ({ sql, bindings }) => {
        logger.debug(sql, { bindings });
      });
    }
    return instance as any;
  };
}
