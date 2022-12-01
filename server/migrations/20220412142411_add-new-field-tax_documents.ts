import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "ES_TAX_DOCUMENTS");
  await addFeatureFlag(knex, "ES_TAX_DOCUMENTS_FIELD", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "ES_TAX_DOCUMENTS_FIELD");
  await removeFieldType(knex, "ES_TAX_DOCUMENTS");
}

export const config = {
  transaction: false,
};
