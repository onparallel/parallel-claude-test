import { inject, injectable } from "inversify";
import Knex from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreatePetitionReminder, PetitionReminder } from "../__types";

@injectable()
export class ReminderRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadReminder = this.buildLoadBy("petition_reminder", "id");

  async createReminders(data: CreatePetitionReminder[]) {
    return await this.insert("petition_reminder", data).returning("*");
  }

  async updateReminder(id: number, data: Partial<PetitionReminder>) {
    const rows = await this.from("petition_reminder")
      .where("id", id)
      .update(data, "*");
    return rows[0];
  }
}
