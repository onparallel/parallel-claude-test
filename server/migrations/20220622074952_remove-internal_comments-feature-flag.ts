import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "INTERNAL_COMMENTS");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "INTERNAL_COMMENTS", true);
}
