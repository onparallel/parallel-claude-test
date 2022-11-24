import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PETITION_PDF_EXPORT");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PETITION_PDF_EXPORT", true);
}
