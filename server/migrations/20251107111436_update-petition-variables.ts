import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- every variable in database is a NUMBER type
    update petition
    set variables = (
      select jsonb_agg(
        variable || jsonb_build_object(
          'type', 'NUMBER'::text
        )
      )
      from jsonb_array_elements(variables) as variable
    )
    where jsonb_array_length(variables) > 0;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set variables = (
      select jsonb_agg(
        jsonb_build_object(
          'name', variable->>'name',
          'default_value',  case when variable->>'type' = 'NUMBER' then (variable->'default_value')::float else 0 end,
          'show_in_replies', (variable->>'show_in_replies')::boolean,
          'value_labels', case when variable->>'type' = 'NUMBER' then (variable->'value_labels')::jsonb else '[]'::jsonb end
        )
      )
      from jsonb_array_elements(variables) as variable
    )
    where jsonb_array_length(variables) > 0;
  `);
}
