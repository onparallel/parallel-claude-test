import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_user_notification", (t) => {
    t.timestamp("read_at").nullable().defaultTo(null);
  });
  await knex.schema.alterTable("petition_contact_notification", (t) => {
    t.timestamp("read_at").nullable().defaultTo(null);
  });

  await knex.raw(/* sql */ `
    -- mark old columns as deprecated
    comment on column petition_user_notification.is_read is '@deprecated';
    comment on column petition_contact_notification.is_read is '@deprecated';

    -- update read_at with processed_at for read notifications
    update petition_user_notification set "read_at" = "processed_at"
    where is_read = true and processed_at is not null;

    update petition_contact_notification set "read_at" = "processed_at"
    where is_read = true and processed_at is not null;


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
  await knex.schema.alterTable("petition_user_notification", (t) => {
    t.dropColumn("read_at");
  });
  await knex.schema.alterTable("petition_contact_notification", (t) => {
    t.dropColumn("read_at");
  });

  await knex.raw(/* sql */ `
    comment on column petition_user_notification.is_read is null;
    comment on column petition_contact_notification.is_read is null;
  `);
}
