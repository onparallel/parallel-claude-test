import { Knex } from "knex";
import { addPetitionEvent, removePetitionEvent } from "./helpers/petitionEvents";
import { addProfileEvent } from "./helpers/profileEvents";

export async function up(knex: Knex): Promise<void> {
  await removePetitionEvent(knex, "PROFILE_DEASSOCIATED");
  await removeProfileEvent(knex, "PETITION_DEASSOCIATED");
}

export async function down(knex: Knex): Promise<void> {
  await addPetitionEvent(knex, "PROFILE_DEASSOCIATED");
  await addProfileEvent(knex, "PETITION_DEASSOCIATED");
}

async function removeProfileEvent(knex: Knex, eventName: string) {
  const { rows } = await knex.raw<{
    rows: { profile_event: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::profile_event_type)) as profile_event;
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
