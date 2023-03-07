import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "DATE_TIME");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "DATE_TIME");
}

export const config = {
  transaction: false,
};
