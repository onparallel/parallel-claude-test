import { Knex } from "knex";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "DOW_JONES_PROFILE_DOWNLOAD");
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "DOW_JONES_PROFILE_DOWNLOAD");
}
