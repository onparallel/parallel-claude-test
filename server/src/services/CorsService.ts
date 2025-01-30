import cors from "cors";
import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { isNullish } from "remeda";
import { callbackify } from "util";
import { KNEX } from "../db/knex";
import { ILogger, LOGGER } from "./Logger";

export const CORS_SERVICE = Symbol.for("CORS_SERVICE");

export interface ICorsService {
  handler(): ReturnType<typeof cors>;
}

@injectable()
export class CorsService {
  // we use a dataloader because it makes it easy to handle concurrent requests and memoization, nothing more
  private loader: DataLoader<string, Set<string>>;
  private lastHostCheck: number | undefined;

  constructor(
    @inject(KNEX) private knex: Knex,
    @inject(LOGGER) private logger: ILogger,
  ) {
    this.loader = new DataLoader<string, Set<string>>(async (keys) => {
      this.logger.info("Loading custom hosts for CORS headers");
      const hosts = await this.knex
        .from("organization")
        .whereNotNull("custom_host")
        .and.not.whereLike("custom_host", "%.onparallel.com")
        .distinct("custom_host");
      return [new Set(hosts)];
    });
  }

  handler() {
    return cors({
      origin: callbackify(async (origin: string | undefined) => {
        if (isNullish(origin)) {
          return false;
        }
        if (origin.endsWith(".onparallel.com")) {
          return true;
        }
        if (isNullish(this.lastHostCheck) || Date.now() - this.lastHostCheck > 10 * 60 * 1_000) {
          this.lastHostCheck = Date.now();
          this.loader.clear("");
        }
        const hosts = await this.loader.load("");
        return hosts.has(origin);
      }),
    });
  }
}
