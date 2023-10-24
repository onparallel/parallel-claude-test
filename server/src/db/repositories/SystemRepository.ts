import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { QUEUES_SERVICE, IQueuesService } from "../../services/QueuesService";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { CreateSystemEvent } from "../events/SystemEvent";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class SystemRepository extends BaseRepository {
  constructor(
    @inject(KNEX) knex: Knex,
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
  ) {
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

  async loadUserLoggedInEvents(userId: number) {
    return await this.from("system_event")
      .where({ type: "USER_LOGGED_IN" })
      .whereRaw(/* sql */ `(("data" ->> 'user_id')::int) = ?`, [userId])
      .select("*");
  }

  async markEventAsProcessed(id: number, processedBy: string) {
    await this.from("system_event").where("id", id).update({
      processed_by: processedBy,
      processed_at: this.now(),
    });
  }
}
