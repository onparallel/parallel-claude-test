import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { QUEUES_SERVICE, IQueuesService } from "../../services/queues";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { CreateSystemEvent } from "../events";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class SystemRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(QUEUES_SERVICE) private queues: IQueuesService) {
    super(knex);
  }

  async createEvent(events: MaybeArray<CreateSystemEvent>, t?: Knex.Transaction) {
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return [];
    }
    const systemEvents = await this.insert("system_event", eventsArray, t);
    await this.queues.enqueueEvents(systemEvents, "system_event", undefined, t);
    return systemEvents;
  }

  async loadUserLoggedInEventsCount(userId: number): Promise<number> {
    const [{ count }] = await this.from("system_event")
      .where({ type: "USER_LOGGED_IN" })
      .whereRaw(/* sql */ `(("data" ->> 'user_id')::int) = ?`, [userId])
      .select<{ count: number }[]>(this.count());

    return count;
  }
}
