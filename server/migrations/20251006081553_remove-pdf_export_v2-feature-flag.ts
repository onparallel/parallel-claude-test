import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PDF_EXPORT_V2");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PDF_EXPORT_V2");
}
