import { interfaces } from "inversify";
import { Knex, knex } from "knex";
import { CONFIG, Config } from "../config";
import { LOGGER, ILogger } from "../services/logger";
import "./helpers/knexExtensions";
import { TableTypes } from "./__types";

export const KNEX = Symbol.for("KNEX");
export const KNEX_READONLY = Symbol.for("KNEX_READONLY");

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
