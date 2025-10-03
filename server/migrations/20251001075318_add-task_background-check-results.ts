import type { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "BACKGROUND_CHECK_RESULTS_PDF");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "BACKGROUND_CHECK_RESULTS_PDF");
}
