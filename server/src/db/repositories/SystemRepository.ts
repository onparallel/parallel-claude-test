import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { IQueuesService, QUEUES_SERVICE } from "../../services/QueuesService";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { CreateSystemEvent } from "../events/SystemEvent";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX, KNEX_READ_ONLY } from "../knex";

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

  async getUserLoggedInEvents(userId: number) {
    return await this.from("system_event")
      .where({ type: "USER_LOGGED_IN" })
      .whereRaw(/* sql */ `(("data" ->> 'user_id')::int) = ?`, [userId])
      .select("*");
  }
}

@injectable()
export class ReadOnlySystemRepository extends SystemRepository {
  constructor(@inject(KNEX_READ_ONLY) knex: Knex, @inject(QUEUES_SERVICE) queues: IQueuesService) {
    super(knex, queues);
  }
}
