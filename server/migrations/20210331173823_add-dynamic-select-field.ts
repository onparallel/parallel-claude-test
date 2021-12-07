import { Knex } from "knex";
import { addFieldType, removeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addFieldType(knex, "DYNAMIC_SELECT");
}

export async function down(knex: Knex): Promise<void> {
  await removeFieldType(knex, "DYNAMIC_SELECT");
}
