import { Knex } from "knex";

export async function addUserNotificationType(knex: Knex, type: string) {
  await knex.schema.raw(/* sql */ `
    alter type "petition_user_notification_type" add value '${type}';
  `);
}

export async function removeUserNotificationType(knex: Knex, type: string) {
  // get existing notification types
  const { rows } = await knex.raw<{
    rows: { user_notification_type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::petition_user_notification_type)) as user_notification_type;
  `);

  // recreate petition_user_notification_type enum without this event
  await knex.raw(/* sql */ `
    alter type petition_user_notification_type rename to petition_user_notification_type_old;
    create type petition_user_notification_type as enum (${rows
      .map((r) => r.user_notification_type)
      .filter((f) => f !== type)
      .map((f) => `'${f}'`)
      .join(",")});

    delete from petition_user_notification where type = '${type}';
    alter table petition_user_notification alter column "type" type petition_user_notification_type using "type"::varchar::petition_user_notification_type;
    drop type petition_user_notification_type_old;
  `);
}
