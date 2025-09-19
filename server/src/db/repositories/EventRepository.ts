import { inject } from "inversify";
import { Knex } from "knex";
import { entries, groupBy, map, omit, pipe } from "remeda";
import { assert } from "ts-essentials";
import { pFlatMap } from "../../util/promises/pFlatMap";
import { PetitionEvent, ProfileEvent, SystemEvent } from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

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
  readonly pickEventToProcess = this.buildBatchProcessor<
    {
      id: number;
      tableName: "petition_event" | "system_event" | "profile_event";
      createdAt: Date;
      pickedBy: string;
    },
    PetitionEvent | ProfileEvent | SystemEvent | null
  >(async (keys, t) => {
    if (keys.length === 0) {
      return [];
    }
    const results: Array<
      (PetitionEvent | ProfileEvent | SystemEvent) & { original_index: number }
    > = await pFlatMap(
      pipe(
        keys,
        map.indexed((k, i) => ({ ...k, originalIndex: i })), // TODO: remeda upgrade
        groupBy((key) => key.tableName),
        entries(),
      ),
      async ([tableName, keys]) => {
        assert(
          tableName === "petition_event" ||
            tableName === "system_event" ||
            tableName === "profile_event",
          `Table name must be one of: petition_event, system_event, profile_event`,
        );
        return await this.raw<
          (PetitionEvent | ProfileEvent | SystemEvent) & { original_index: number }
        >(
          /* sql */ `
              with updates as (
                select * from (?) as t(id, created_at, picked_by, original_index)
              )
              update ?? e
              set processed_by = u.picked_by
              from updates u
              where e.id = u.id 
                and e.processed_by is null 
                and date_trunc('milliseconds', e.created_at) = date_trunc('milliseconds', u.created_at)
              returning e.*, u.original_index
            `,
          [
            this.sqlValues(
              keys.map((key) => [key.id, key.createdAt, key.pickedBy, key.originalIndex]),
              ["int", "timestamptz", "text", "int"],
            ),
            tableName,
          ],
          t,
        );
      },
      { concurrency: 1 },
    );

    return keys.map((_, originalIndex) => {
      const result = results.find((e) => e.original_index === originalIndex);
      return result ? omit(result, ["original_index"]) : null;
    }) as unknown as Array<PetitionEvent | ProfileEvent | SystemEvent | null>;
  });

  readonly markEventAsProcessed = this.buildBatchProcessor<
    {
      id: number;
      tableName: "petition_event" | "system_event" | "profile_event";
    },
    void
  >(async (keys, t) => {
    if (keys.length === 0) {
      return [];
    }
    await pFlatMap(
      pipe(
        keys,
        groupBy((key) => key.tableName),
        entries(),
      ),
      async ([tableName, keys]) => {
        assert(
          tableName === "petition_event" ||
            tableName === "system_event" ||
            tableName === "profile_event",
          `Table name must be one of: petition_event, system_event, profile_event`,
        );
        await this.from(tableName, t)
          .whereIn(
            "id",
            keys.map((key) => key.id),
          )
          .update("processed_at", this.now());
      },
      { concurrency: 1 },
    );

    // make sure to return the same number of keys as the input
    return keys.map(() => void 0);
  });
}
