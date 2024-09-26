import type { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "CLOSE_PETITIONS");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "CLOSE_PETITIONS");
}
