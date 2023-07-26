import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_list_view 
    set "data" = "data" || jsonb_build_object('columns', null)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_list_view 
    set "data" = "data" - 'columns'
  `);
}
