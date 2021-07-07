import { Knex } from "knex";

export async function addSystemEvent(knex: Knex, eventName: string) {
  await knex.schema.raw(/* sql */ `
    alter type "system_event_type" add value '${eventName}';
  `);
}

export async function removeSystemEvent(knex: Knex, eventName: string) {
  const { rows } = await knex.raw<{
    rows: { system_event: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::system_event_type)) as system_event;
  `);

  await knex.raw(/* sql */ `
    alter type system_event_type rename to system_event_type_old;
    create type system_event_type as enum (${rows
      .map((r) => r.system_event)
      .filter((f) => f !== eventName)
      .map((f) => `'${f}'`)
      .join(",")});

    delete from system_event where type = '${eventName}';
    alter table system_event alter column "type" type system_event_type using "type"::varchar::system_event_type;
    drop type system_event_type_old;
  `);
}
