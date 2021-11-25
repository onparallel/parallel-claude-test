import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "API_TOKENS");
  await addFeatureFlag(knex, "DEVELOPER_ACCESS", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "DEVELOPER_ACCESS");
  await addFeatureFlag(knex, "API_TOKENS", false);
}
