import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set "options" = "options" || jsonb_build_object('format', 'null'::jsonb)
      where "type" = 'SHORT_TEXT' and options->'format' is null;    
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set "options" = "options" - 'format' where "type" = 'SHORT_TEXT';
  `);
}
