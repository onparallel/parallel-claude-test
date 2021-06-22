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
    create index "petition_user_notification__user_id__is_read" on petition_user_notification(user_id) where is_read = false;

    -- useful to search every read and unread notification of a user
    create index "petition_user_notification__user_id" on petition_user_notification(user_id);
`);
}

export async function down(knex: Knex): Promise<void> {
  await removeUserNotificationType(knex, "PETITION_COMPLETED");
  await removeUserNotificationType(knex, "SIGNATURE_COMPLETED");
  await removeUserNotificationType(knex, "SIGNATURE_CANCELLED");
  await removeUserNotificationType(knex, "PETITION_SHARED");
  await removeUserNotificationType(knex, "MESSAGE_EMAIL_BOUNCED");

  await knex.raw(/* sql */ `
      drop index "petition_user_notification__user_id__is_read";
      drop index "petition_user_notification__user_id";
  `);
}

export const config = {
  transaction: false,
};
