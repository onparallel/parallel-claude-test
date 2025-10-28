import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update "organization"
        set preferences = jsonb_build_object(
            'BACKGROUND_CHECK', jsonb_build_object(
                'threshold', (preferences->'BACKGROUND_CHECK'->'cutoff')::float
            )
        )
        where preferences->'BACKGROUND_CHECK'->'cutoff' is not null
        and deleted_at is null;
    `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update "organization"
        set preferences = jsonb_build_object(
            'BACKGROUND_CHECK', jsonb_build_object(
                'cutoff', (preferences->'BACKGROUND_CHECK'->'threshold')::float
            )
        )
        where preferences->'BACKGROUND_CHECK'->'threshold' is not null
        and deleted_at is null;
    `);
}
