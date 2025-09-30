import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "BACKGROUND_CHECK");
  await addFeatureFlag(knex, "BACKGROUND_CHECK", false);
  await addTaskName(knex, "BACKGROUND_CHECK_PROFILE_PDF");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "BACKGROUND_CHECK");
  await removeFeatureFlag(knex, "BACKGROUND_CHECK");
  await removeTaskName(knex, "BACKGROUND_CHECK_PROFILE_PDF");
}
