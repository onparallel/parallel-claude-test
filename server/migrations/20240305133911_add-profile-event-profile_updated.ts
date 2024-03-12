import type { Knex } from "knex";
import { addProfileEvent, removeProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await addProfileEvent(knex, "PROFILE_UPDATED");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileEvent(knex, "PROFILE_UPDATED");
}
