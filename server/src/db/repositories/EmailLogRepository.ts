import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import {
  CreateEmailLog,
  EmailLog,
  CreateEmailEvent,
  EmailEvent,
} from "../__types";
import { fromDataLoader } from "../../util/fromDataLoader";
import DataLoader from "dataloader";
import { groupBy, sortBy } from "remeda";

@injectable()
export class EmailLogRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadEmailLog = this.buildLoadById("email_log", "id");

  async createEmail(data: CreateEmailLog) {
    const rows = await this.insert("email_log", data).returning("*");
    return rows[0];
  }

  async updateWithResponse(id: number, data: Partial<EmailLog>) {
    return await this.from("email_log")
      .update(
        {
          ...data,
          sent_at: this.now(),
        },
        "*"
      )
      .where("id", id);
  }

  async findInternalId(externalId: string) {
    const [entry] = await this.from("email_log")
      .where("external_id", externalId)
      .select("id");
    return entry ? entry.id : null;
  }

  async createEvent(data: CreateEmailEvent) {
    return await this.insert("email_event", data);
  }

  readonly loadEmailEvents = fromDataLoader(
    new DataLoader<number, EmailEvent[]>(async (ids) => {
      const rows = await this.from("email_event").whereIn("email_log_id", ids);
      const byEmailId = groupBy(rows, (r) => r.email_log_id);
      return ids.map((id) =>
        byEmailId[id] ? sortBy(byEmailId[id], (event) => event.created_at) : []
      );
    })
  );
}
