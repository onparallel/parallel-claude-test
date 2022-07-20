import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "PETITION_CONTACTLESS_LINK_CREATED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "PETITION_CONTACTLESS_LINK_CREATED");
}
