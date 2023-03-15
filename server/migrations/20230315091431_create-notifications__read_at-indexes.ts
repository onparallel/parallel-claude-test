import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
	-- create new indexes pointing to read_at instead of is_read
	CREATE INDEX petition_user_notification__user_id__read_at 
      ON petition_user_notification (user_id) 
      INCLUDE (id, type, created_at) 
      WHERE read_at IS NULL;

    CREATE INDEX pun__unprocessed_unread_notifications 
    ON petition_user_notification (id)
    WHERE (
      ((type = 'COMMENT_CREATED'::petition_user_notification_type) OR (type = 'SIGNATURE_CANCELLED'::petition_user_notification_type)) 
      AND (read_at IS NULL)
      AND (processed_at IS NULL)
    );

    CREATE INDEX pcn__unprocessed_unread_notifications
    ON petition_contact_notification (id) 
    WHERE (
      (type = 'COMMENT_CREATED'::petition_contact_notification_type)
      AND (read_at IS NULL) 
      AND (processed_at IS NULL)
    );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        DROP INDEX petition_user_notification__user_id__read_at;
        DROP INDEX pun__unprocessed_unread_notifications;
        DROP INDEX pcn__unprocessed_unread_notifications;
    `);
}
