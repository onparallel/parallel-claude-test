import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "FIELD_GROUP");
  await addFeatureFlag(knex, "FIELD_GROUP", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "FIELD_GROUP");
  await removeFeatureFlag(knex, "FIELD_GROUP");
}
