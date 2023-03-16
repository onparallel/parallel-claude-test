import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_user_notification", (t) => {
    t.dropColumn("is_read");
  });

  await knex.schema.alterTable("petition_contact_notification", (t) => {
    t.dropColumn("is_read");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_user_notification", (t) => {
    t.boolean("is_read").notNullable().defaultTo(false);
  });

  await knex.schema.alterTable("petition_contact_notification", (t) => {
    t.boolean("is_read").notNullable().defaultTo(false);
  });

  await knex.raw(/* sql */ `
    comment on column petition_user_notification.is_read is '@deprecated';
    comment on column petition_contact_notification.is_read is '@deprecated';

    CREATE INDEX petition_user_notification__user_id__is_ead ON petition_user_notification (user_id) INCLUDE (id, type, created_at) WHERE (is_read = false);
    CREATE INDEX pun__unprocessed_notifications ON petition_user_notification (id) WHERE (((type = 'COMMENT_CREATED'::petition_user_notification_type) OR (type = 'SIGNATURE_CANCELLED'::petition_user_notification_type)) AND (is_read = false) AND (processed_at IS NULL));

    CREATE INDEX pcn__unprocessed_comment_notifications ON petition_contact_notification (id) WHERE ((type = 'COMMENT_CREATED'::petition_contact_notification_type) AND (is_read = false) AND (processed_at IS NULL));
  `);
}
