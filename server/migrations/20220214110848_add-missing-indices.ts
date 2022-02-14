import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Make it easier for the petition-notifications worker to find notifications to process
  await knex.raw(/* sql */ `
    create index pun__unprocessed_comment_notifications on petition_user_notification (id)
      where "type" = 'COMMENT_CREATED'::petition_user_notification_type and is_read = false and processed_at is null;
  `);
  await knex.raw(/* sql */ `
    create index pcn__unprocessed_comment_notifications on petition_contact_notification (id)
      where "type" = 'COMMENT_CREATED'::petition_contact_notification_type and is_read = false and processed_at is null;
  `);
  // Make it easier for the scheduled-trigger worker to find scheduled messages
  await knex.raw(/* sql */ `
    create index petition_message__scheduled_at on petition_message (scheduled_at)
      where "status" = 'SCHEDULED' and scheduled_at is not null;
  `);
  // Make it easier for find replies for fields
  await knex.raw(/* sql */ `
    create index petition_field_reply__petition_field_id on petition_field_reply (petition_field_id)
      where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index pun__unprocessed_comment_notifications
  `);
  await knex.raw(/* sql */ `
    drop index pcn__unprocessed_comment_notifications
  `);
  await knex.raw(/* sql */ `
    drop index petition_message__scheduled_at
  `);
  await knex.raw(/* sql */ `
    drop index petition_field_reply__petition_field_id
  `);
}
