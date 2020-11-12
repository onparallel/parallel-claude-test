import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateEmailEvent, CreateEmailLog, EmailLog } from "../__types";

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

  async createEmailEvent(data: CreateEmailEvent) {
    return await this.insert("email_event", data);
  }

  readonly loadEmailEvents = this.buildLoadMultipleBy(
    "email_event",
    "email_log_id",
    (q) => q.orderBy("created_at")
  );
}
