import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "COPY_PETITION_REPLIES", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "COPY_PETITION_REPLIES");
}
