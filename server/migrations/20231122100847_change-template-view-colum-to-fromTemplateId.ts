import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE petition_list_view
    SET data = jsonb_set(
        data,
        '{columns}',
        (
            SELECT jsonb_agg(
                CASE WHEN value = 'template' THEN 'fromTemplateId' ELSE value END
            )
            FROM jsonb_array_elements_text(data->'columns') AS value
        )::jsonb
    )
    WHERE data->'columns' @> '["template"]';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    UPDATE petition_list_view
    SET data = jsonb_set(
        data,
        '{columns}',
        (
            SELECT jsonb_agg(
                CASE WHEN value = 'fromTemplateId' THEN 'template' ELSE value END
            )
            FROM jsonb_array_elements_text(data->'columns') AS value
        )::jsonb
    )
    WHERE data->'columns' @> '["fromTemplateId"]';
  `);
}
