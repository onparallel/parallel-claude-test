import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_user_notification 
    set read_at = coalesce("processed_at", "created_at")
    where is_read = true;

    update petition_contact_notification
    set read_at = coalesce("processed_at", "created_at")
    where is_read = true;
  `);
}

export async function down(knex: Knex): Promise<void> {}
