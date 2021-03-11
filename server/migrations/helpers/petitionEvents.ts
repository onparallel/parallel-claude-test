import { Knex } from "knex";

export async function addPetitionEvent(knex: Knex, eventName: string) {
  await knex.schema.raw(/* sql */ `
    alter type "petition_event_type" add value '${eventName}';
  `);
}

export async function removePetitionEvent(knex: Knex, eventName: string) {
  // get existing petition events
  const { rows } = await knex.raw<{
    rows: { petition_event: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::petition_event_type)) as petition_event;
  `);

  // recreate petition_event_type enum without this event
  await knex.raw(/* sql */ `
    alter type petition_event_type rename to petition_event_type_old;
    create type petition_event_type as enum (${rows
      .map((r) => r.petition_event)
      .filter((f) => f !== eventName)
      .map((f) => `'${f}'`)
      .join(",")});

    delete from petition_event where type = '${eventName}';
    alter table petition_event alter column "type" type petition_event_type using "type"::varchar::petition_event_type;
    drop type petition_event_type_old;
  `);
}
