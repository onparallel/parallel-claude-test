import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set options = '{"hasPageBreak": false}'::json where "type" = 'HEADING'
  `);
}

export async function down(knex: Knex): Promise<void> {}
