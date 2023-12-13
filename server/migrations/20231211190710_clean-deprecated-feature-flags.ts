import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "DEVELOPER_ACCESS");
  await removeFeatureFlag(knex, "COPY_PETITION_REPLIES");
  await removeFeatureFlag(knex, "FIELD_GROUP");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "DEVELOPER_ACCESS", false);
  await addFeatureFlag(knex, "COPY_PETITION_REPLIES", false);
  await addFeatureFlag(knex, "FIELD_GROUP", false);
}
