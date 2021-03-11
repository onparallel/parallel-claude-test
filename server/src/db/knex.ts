import { interfaces } from "inversify";
import { Knex, knex } from "knex";
import { CONFIG, Config } from "../config";
import { LOGGER, Logger } from "../services/logger";
import "./helpers/knexExtensions";

export const KNEX = Symbol.for("KNEX");

export function createKnex({ container }: interfaces.Context): Knex {
  const config = container.get<Config>(CONFIG);
  const logger = container.get<Logger>(LOGGER);
  const instance = knex({
    client: "pg",
    connection: config.db,
    asyncStackTraces: process.env.NODE_ENV !== "production",
    pool: {
      min: 5,
      max: config.db.maxConnections,
    },
  });
  if (process.env.NODE_ENV === "development") {
    instance.on("query", ({ sql, bindings }) => {
      logger.debug(sql, { bindings });
    });
  }
  return instance;
}
