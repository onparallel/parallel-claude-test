import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PETITION_ACCESS_RECIPIENT_URL_FIELD", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PETITION_ACCESS_RECIPIENT_URL_FIELD");
}
