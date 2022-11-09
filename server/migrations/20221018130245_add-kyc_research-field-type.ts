import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "DOW_JONES_KYC");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "DOW_JONES_KYC");
}

export const config = {
  transaction: false,
};
