import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    update petition set reminders_config = reminders_config || jsonb_build_object('limit', '10'::jsonb);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    update petition set reminders_config = reminders_config::jsonb - 'limit';
  `);
}
