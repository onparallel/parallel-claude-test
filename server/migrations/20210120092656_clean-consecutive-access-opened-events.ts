import { differenceInMinutes } from "date-fns";
import * as Knex from "knex";
import { groupBy } from "remeda";
import { PetitionEvent } from "../src/db/__types";
import { UnwrapArray } from "../src/util/types";

export async function up(knex: Knex): Promise<void> {
  // select every ACCESS_OPENED event
  const rows = await knex
    .from<PetitionEvent>("petition_event")
    .where({ type: "ACCESS_OPENED" })
    .select(["id", "petition_id", "created_at"])
    .orderBy("created_at", "asc");

  // group events by petition_id
  const byPetitionId = Object.values(groupBy(rows, (r) => r.petition_id));

  const idsToDelete: number[] = [];
  for (const petitionEvents of byPetitionId) {
    let lastEvent: null | UnwrapArray<typeof petitionEvents> = null;
    /* for each two consecutive events of the same petition
    if the creation date differs in less than 30 minutes
    the newest one is considered 'duplicated' and to be deleted */
    for (const event of petitionEvents) {
      if (
        lastEvent &&
        differenceInMinutes(event.created_at, lastEvent.created_at) <= 30
      ) {
        idsToDelete.push(event.id);
      }
      lastEvent = event;
    }
  }
  await knex.from("petition_event").whereIn("id", idsToDelete).delete();
}

export async function down(knex: Knex): Promise<void> {}
