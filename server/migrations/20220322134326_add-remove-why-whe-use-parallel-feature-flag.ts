import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "REMOVE_WHY_WE_USE_PARALLEL", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "REMOVE_WHY_WE_USE_PARALLEL");
}
