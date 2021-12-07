import { Knex } from "knex";
import { addUserNotificationType, removeUserNotificationType } from "./helpers/notificationTypes";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";

export async function up(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK");
  await addUserNotificationType(knex, "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
  drop index "pun__comment_created__petition_id__data";
  drop index "pun__comment_created__user_id__petition_id__data";
`);

  await removePetitionEvent(knex, "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK");
  await removeUserNotificationType(knex, "ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK");

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
