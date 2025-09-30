import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "BULK_PETITION_SEND");
  await addTaskName(knex, "TEMPLATE_REPLIES_CSV_EXPORT");
  await addFeatureFlag(knex, "BULK_PETITION_SEND_TASK", false);
  await addFeatureFlag(knex, "TEMPLATE_REPLIES_CSV_EXPORT_TASK", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeTaskName(knex, "BULK_PETITION_SEND");
  await removeTaskName(knex, "TEMPLATE_REPLIES_CSV_EXPORT");
  await removeFeatureFlag(knex, "BULK_PETITION_SEND_TASK");
  await removeFeatureFlag(knex, "TEMPLATE_REPLIES_CSV_EXPORT_TASK");
}
