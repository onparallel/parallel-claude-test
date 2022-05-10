import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { AWS_SERVICE, IAws } from "../../services/aws";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { CreateSystemEvent } from "../events";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class SystemRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(AWS_SERVICE) private aws: IAws) {
    super(knex);
  }

  async createEvent(events: MaybeArray<CreateSystemEvent>, t?: Knex.Transaction) {
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return [];
    }
    const systemEvents = await this.insert("system_event", eventsArray, t);
    await this.aws.enqueueEvents(systemEvents, t);
    return systemEvents;
  }

  async loadUserLoggedInEventsCount(userId: number): Promise<number> {
    const [{ count }] = await this.from("system_event")
      .where({ type: "USER_LOGGED_IN" })
      .whereRaw(/* sql */ `(("data" ->> 'user_id')::int) = ?`, [userId])
      .select(this.count());

    return count;
  }
}
