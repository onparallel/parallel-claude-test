import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "CREATE_PROFILE_TYPE", true);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "CREATE_PROFILE_TYPE");
}
