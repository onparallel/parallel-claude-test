import type { Knex } from "knex";
import { addProfileTypeFieldType, removeProfileTypeFieldType } from "./helpers/fieldTypes";

export async function up(knex: Knex): Promise<void> {
  await addProfileTypeFieldType(knex, "CHECKBOX");
}

export async function down(knex: Knex): Promise<void> {
  await removeProfileTypeFieldType(knex, "CHECKBOX");

  await knex.raw(/* sql */ `
    update petition_field
    set options = options - 'standardList'
    where type = 'CHECKBOX'
    and options->>'standardList' is not null;
  `);
}
