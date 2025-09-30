import type { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "PROFILES_EXCEL_EXPORT");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "PROFILES_EXCEL_EXPORT");
}
