import { Knex } from "knex";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await addProfileEvent(knex, "PROFILE_CLOSED");
  await addProfileEvent(knex, "PROFILE_SCHEDULED_FOR_DELETION");
  await addProfileEvent(knex, "PROFILE_REOPENED");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileEvent(knex, "PROFILE_CLOSED");
  await removeProfileEvent(knex, "PROFILE_SCHEDULED_FOR_DELETION");
  await removeProfileEvent(knex, "PROFILE_REOPENED");
}
