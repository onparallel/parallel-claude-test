import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "NUMBER");
  await addFieldType(knex, "PHONE");
  await addFieldType(knex, "DATE");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "NUMBER");
  await removeFieldType(knex, "PHONE");
  await removeFieldType(knex, "DATE");
}

export const config = {
  transaction: false,
};
