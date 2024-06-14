import type { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "PROFILE_NAME_PATTERN_UPDATED");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "PROFILE_NAME_PATTERN_UPDATED");
}
