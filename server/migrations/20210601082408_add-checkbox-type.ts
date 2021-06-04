import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "CHECKBOX");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "CHECKBOX");
}

export const config = {
  transaction: false,
};
