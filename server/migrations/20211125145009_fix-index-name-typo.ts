import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter index petition_field__petition_id__alias__unqiue rename to petition_field__petition_id__alias__unique
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter index petition_field__petition_id__alias__unique rename to petition_field__petition_id__alias__unqiue
  `);
}
