import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "SIGN_WITH_EMBEDDED_IMAGE");
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "SIGN_WITH_EMBEDDED_IMAGE");
}
