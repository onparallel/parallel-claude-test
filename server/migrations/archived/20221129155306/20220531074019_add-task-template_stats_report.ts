import { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "TEMPLATE_STATS_REPORT");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "TEMPLATE_STATS_REPORT");
}
