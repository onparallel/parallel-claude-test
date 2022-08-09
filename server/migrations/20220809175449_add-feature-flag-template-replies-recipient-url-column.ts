import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "TEMPLATE_REPLIES_RECIPIENT_URL", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "TEMPLATE_REPLIES_RECIPIENT_URL");
}
