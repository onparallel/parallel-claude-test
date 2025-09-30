import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "RECIPIENT_LANG_CA", false);
  await addFeatureFlag(knex, "RECIPIENT_LANG_IT", false);
  await addFeatureFlag(knex, "RECIPIENT_LANG_PT", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "RECIPIENT_LANG_CA");
  await removeFeatureFlag(knex, "RECIPIENT_LANG_IT");
  await removeFeatureFlag(knex, "RECIPIENT_LANG_PT");
}
