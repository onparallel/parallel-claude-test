import { inject } from "inversify";
import { BaseRepository, TableTypes } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { Knex } from "knex";

export class EventRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  /**
   * retrieves an unprocessed petition or system event for the event-processor.
   *
   * created_at Date of the event must match with param createdAt.
   * This will ensure to only pick the most up-to-date event for processing, as some events can be updated in DB before the event-processor processes them
   */
  async pickEventToProcess<TName extends "petition_event" | "system_event" | "profile_event">(
    id: number,
    tableName: TName,
    createdAt: Date,
  ): Promise<TableTypes[TName] | undefined> {
    const [event] = await this.from(tableName)
      .update("processed_at", this.now())
      .whereRaw(
        /* sql */ `id = ? and processed_at is null and date_trunc('milliseconds', created_at) = ?::timestamptz`,
        [id, createdAt],
      )
      .returning("*");

    return event as unknown as TableTypes[TName] | undefined;
  }

  async markEventAsProcessed<TName extends "petition_event" | "system_event" | "profile_event">(
    id: number,
    tableName: TName,
    processedBy: string,
  ) {
    await this.from(tableName)
      .where("id", id)
      .update("processed_at", this.now())
      .update("processed_by", processedBy);
  }
}
