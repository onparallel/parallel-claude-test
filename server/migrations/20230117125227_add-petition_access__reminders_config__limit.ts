import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    update petition_access set reminders_config = reminders_config || jsonb_build_object('limit', '10'::jsonb) where reminders_config is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    update petition_access set reminders_config = reminders_config::jsonb - 'limit' where reminders_config is not null;
  `);
}
