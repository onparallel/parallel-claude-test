import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field
    set options = options || jsonb_build_object(
      'autoSearchConfig', jsonb_build_object(
        'name', options->'autoSearchConfig'->'name',
        'date', options->'autoSearchConfig'->'date',
        'type', options->'autoSearchConfig'->>'type',
        'country', null
      )
    )
    where options->>'autoSearchConfig' is not null
    and type = 'BACKGROUND_CHECK';  
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field
    set options = options || jsonb_build_object(
      'autoSearchConfig', jsonb_build_object(
        'name', options->'autoSearchConfig'->'name',
        'date', options->'autoSearchConfig'->'date',
        'type', options->'autoSearchConfig'->>'type'
      )
    )
    where options->>'autoSearchConfig' is not null
    and type = 'BACKGROUND_CHECK';  
  `);
}
