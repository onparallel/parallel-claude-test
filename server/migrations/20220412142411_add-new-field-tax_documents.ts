import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "TAX_DOCUMENTS");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "TAX_DOCUMENTS");
}

export const config = {
  transaction: false,
};
