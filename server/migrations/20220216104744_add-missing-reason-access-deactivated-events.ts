import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_event set data = data || '{ "reason": "DEACTIVATED_BY_USER" }'::jsonb where type = 'ACCESS_DEACTIVATED' and data->>'reason' is null;
`);
}

export async function down(knex: Knex): Promise<void> {}
