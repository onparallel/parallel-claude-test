import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PROFILES", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PROFILES");
}
