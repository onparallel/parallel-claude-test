import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set variables = (
      select jsonb_agg(
        variable || jsonb_build_object(
          'show_in_replies', true,
          'value_labels', '[]'::jsonb
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
        variable - 'show_in_replies' - 'value_labels'
      )
      from jsonb_array_elements(variables) as variable
    )
    where jsonb_array_length(variables) > 0;
  `);
}
