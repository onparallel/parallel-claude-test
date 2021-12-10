import { Knex } from "knex";
import { addUserNotificationType, removeUserNotificationType } from "./helpers/notificationTypes";
import { addSystemEvent, removeSystemEvent } from "./helpers/systemEvents";

export async function up(knex: Knex): Promise<void> {
  await addSystemEvent(knex, "PETITION_REMINDER_BOUNCED");
  await addUserNotificationType(knex, "REMINDER_EMAIL_BOUNCED");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
  drop index "pun__comment_created__petition_id__data";
  drop index "pun__comment_created__user_id__petition_id__data";
`);

  await knex.from("system_event").where({ type: "PETITION_REMINDER_BOUNCED" }).delete();

  await knex.from("petition_user_notification").where({ type: "REMINDER_EMAIL_BOUNCED" }).delete();

  await removeSystemEvent(knex, "PETITION_REMINDER_BOUNCED");
  await removeUserNotificationType(knex, "REMINDER_EMAIL_BOUNCED");

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
