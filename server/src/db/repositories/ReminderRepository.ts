import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreatePetitionReminder } from "../__types";

@injectable()
export class ReminderRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadReminder = this.buildLoadBy("petition_reminder", "id");

  async createReminders(data: CreatePetitionReminder[]) {
    return await this.insert("petition_reminder", data).returning("*");
  }

  async processReminder(reminderId: number, emailLogId: number) {
    const [row] = await this.from("petition_reminder")
      .where("id", reminderId)
      .update(
        {
          status: "PROCESSED",
          email_log_id: emailLogId,
        },
        "*"
      );
    return row;
  }
}
