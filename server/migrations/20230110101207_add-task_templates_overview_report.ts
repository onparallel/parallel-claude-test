import { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "TEMPLATES_OVERVIEW_REPORT");
  await addTaskName(knex, "TEMPLATES_OVERVIEW_EXPORT");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "TEMPLATES_OVERVIEW_REPORT");
  await removeTaskName(knex, "TEMPLATES_OVERVIEW_EXPORT");
}
