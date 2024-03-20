import type { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "PETITION_SHARING");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "PETITION_SHARING");
}
