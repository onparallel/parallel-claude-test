import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "STATISTICS_VIEW");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "STATISTICS_VIEW", false);
}
