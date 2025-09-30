import { Knex } from "knex";
import { addProfileTypeFieldType, removeProfileTypeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addProfileTypeFieldType(knex, "BACKGROUND_CHECK");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileTypeFieldType(knex, "BACKGROUND_CHECK");
}
