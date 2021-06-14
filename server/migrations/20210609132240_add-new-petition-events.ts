import { Knex } from "knex";
import {
  addPetitionEvent,
  removePetitionEvent,
} from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "TEMPLATE_USED");
  await addPetitionEvent(knex, "PETITION_CLONED");
  await addPetitionEvent(knex, "PETITION_DELETED");
}

export async function down(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "TEMPLATE_USED");
  await removePetitionEvent(knex, "PETITION_CLONED");
  await removePetitionEvent(knex, "PETITION_DELETED");
}
