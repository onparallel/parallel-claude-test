import { Knex } from "knex";
import {
  addPetitionEvent,
  removePetitionEvent,
} from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "ACCESS_DELEGATED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "ACCESS_DELEGATED");
}
