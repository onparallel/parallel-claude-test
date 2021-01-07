import * as Knex from "knex";
import {
  addPetitionEvent,
  removePetitionEvent,
} from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "REPLY_UPDATED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "REPLY_UPDATED");
}
