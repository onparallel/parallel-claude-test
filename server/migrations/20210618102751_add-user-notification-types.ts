import { Knex } from "knex";
import {
  addUserNotificationType,
  removeUserNotificationType,
} from "./helpers/notificationTypes";

export async function up(knex: Knex): Promise<void> {
  await addUserNotificationType(knex, "PETITION_COMPLETED");
  await addUserNotificationType(knex, "SIGNATURE_COMPLETED");
  await addUserNotificationType(knex, "SIGNATURE_CANCELLED");
  await addUserNotificationType(knex, "PETITION_SHARED");
  await addUserNotificationType(knex, "MESSAGE_EMAIL_BOUNCED");

  await knex.raw(/* sql */ `
    -- useful to search every unread notification of a user
    create index "petition_user_notification__user_id__created_at__is_read" on petition_user_notification(user_id, created_at) include (type) where is_read = false;

    -- useful to search every read and unread notification of a user
    create index "petition_user_notification__user_id_created_at" on petition_user_notification(user_id, created_at) include (type);
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "pun__comment_created__petition_id__data";
    drop index "pun__comment_created__user_id__petition_id__data";
    drop index "petition_user_notification__user_id__created_at__is_read";
    drop index "petition_user_notification__user_id_created_at";
  `);

  await removeUserNotificationType(knex, "PETITION_COMPLETED");
  await removeUserNotificationType(knex, "SIGNATURE_COMPLETED");
  await removeUserNotificationType(knex, "SIGNATURE_CANCELLED");
  await removeUserNotificationType(knex, "PETITION_SHARED");
  await removeUserNotificationType(knex, "MESSAGE_EMAIL_BOUNCED");

  await knex.raw(/* sql */ `
  create index "pun__comment_created__petition_id__data" on petition_user_notification (
    petition_id,
    ((data ->> 'petition_field_id')::int),
    ((data ->> 'petition_field_comment_id')::int)
  ) where type = 'COMMENT_CREATED';
  create unique index "pun__comment_created__user_id__petition_id__data" on petition_user_notification (
    user_id,
    petition_id,
    ((data ->> 'petition_field_id')::int),
    ((data ->> 'petition_field_comment_id')::int)
  ) where type = 'COMMENT_CREATED';
  `);
}
