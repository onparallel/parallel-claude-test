import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "SIGNATURE_REMINDER");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "SIGNATURE_REMINDER");
}
