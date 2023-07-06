import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "PROFILE_DEASSOCIATED");
  await removeProfileEvent(knex, "PETITION_DEASSOCIATED");
}

export async function down(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "PROFILE_DEASSOCIATED");
  await addProfileEvent(knex, "PETITION_DEASSOCIATED");
}
