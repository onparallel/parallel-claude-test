import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { Aws, AWS_SERVICE } from "../../services/aws";
import { unMaybeArray } from "../../util/arrays";
import { MaybeArray } from "../../util/types";
import { CreateSystemEvent } from "../events";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class SystemRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex, @inject(AWS_SERVICE) private aws: Aws) {
    super(knex);
  }

  async createEvent(events: MaybeArray<CreateSystemEvent>) {
    const eventsArray = unMaybeArray(events);
    if (eventsArray.length === 0) {
      return [];
    }

    const systemEvents = await this.insert("system_event", eventsArray);

    // dont await this. we may be inside a transaction
    this.aws.enqueueEvents(systemEvents);

    return systemEvents;
  }
}
