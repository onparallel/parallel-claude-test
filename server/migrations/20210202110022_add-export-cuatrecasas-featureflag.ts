import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "EXPORT_CUATRECASAS", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "EXPORT_CUATRECASAS");
}
