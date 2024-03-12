import { Knex } from "knex";

export async function addProfileEvent(knex: Knex, eventName: string) {
  await knex.schema.raw(/* sql */ `
    alter type "profile_event_type" add value '${eventName}';
  `);
}

export async function removeProfileEvent(knex: Knex, eventName: string) {
  const { rows } = await knex.raw<{
    rows: { profile_event: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::profile_event_type)) as profile_event;
  `);

  await knex.raw(/* sql */ `
    delete from "user_profile_event_log" where profile_event_id in (
      select id from profile_event where type = '${eventName}'
    );
  `);

  // recreate profile_event_type enum without this event
  await knex.raw(/* sql */ `
    alter type profile_event_type rename to profile_event_type_old;
    create type profile_event_type as enum (${rows
      .map((r) => r.profile_event)
      .filter((f) => f !== eventName)
      .map((f) => `'${f}'`)
      .join(",")});



    delete from profile_event where type = '${eventName}';
    alter table profile_event alter column "type" type profile_event_type using "type"::varchar::profile_event_type;
    drop type profile_event_type_old;
  `);
}
