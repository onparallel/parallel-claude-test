import { Knex } from "knex";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await addProfileEvent(knex, "PETITION_ASSOCIATED");
  await addProfileEvent(knex, "PETITION_DEASSOCIATED");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileEvent(knex, "PETITION_ASSOCIATED");
  await removeProfileEvent(knex, "PETITION_DEASSOCIATED");
}
