import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set "options" = "options" || jsonb_build_object('maxLength', 'null'::jsonb)
      where "type" in ('TEXT', 'SHORT_TEXT') and options->'maxLength' is null;    
  `);
}

export async function down(knex: Knex): Promise<void> {}
