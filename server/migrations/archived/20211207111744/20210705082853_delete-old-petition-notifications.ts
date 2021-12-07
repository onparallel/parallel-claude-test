import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/*sql*/ `
    -- delete old notifications of deleted petitions
    delete from petition_user_notification where petition_id in (select id from petition where deleted_at is not null);
    delete from petition_contact_notification where petition_id in (select id from petition where deleted_at is not null);

    -- mark all user notifications as read (to avoid filling notifications drawer with unread old info)
    update petition_user_notification set is_read = true;
  `);
}

export async function down(knex: Knex): Promise<void> {}
