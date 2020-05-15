import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("reminders_config");
  });
  await knex.raw(/* sql */ `
    update petition
      set
        reminders_config = json_build_object(
          'offset', reminders_offset,
          'time', reminders_time,
          'timezone', reminders_timezone,
          'weekdaysOnly', reminders_weekdays_only
        )
      where reminders_active
  `);
  await knex.raw(
    /* sql */ `alter table petition drop constraint petition__reminders_check`
  );
  await knex.raw(/* sql */ `
      alter table petition add constraint petition__reminders_check check (
        (reminders_active and reminders_config is not null)
          or (not reminders_active and reminders_config is null)
      )
      `);

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("reminders_offset");
    t.dropColumn("reminders_time");
    t.dropColumn("reminders_timezone");
    t.dropColumn("reminders_weekdays_only");
  });
}

export async function down(knex: Knex): Promise<any> {
  await knex.schema.alterTable("petition", (t) => {
    t.integer("reminders_offset");
    t.string("reminders_time", 5);
    t.string("reminders_timezone");
    t.boolean("reminders_weekdays_only");
  });
  await knex.raw(/* sql */ `
    update petition
      set
        reminders_offset = (reminders_config->'offset')::int,
        reminders_time = (reminders_config->>'time')::text,
        reminders_timezone = (reminders_config->>'timezone')::text,
        reminders_weekdays_only = (reminders_config->'weekdaysOnly')::boolean
      where reminders_active
  `);
  await knex.raw(/* sql */ `
    alter table petition drop constraint petition__reminders_check`);
  await knex.raw(/* sql */ `
    alter table petition add constraint petition__reminders_check check (
      (reminders_active and
        reminders_offset is not null and
        reminders_time is not null and
        reminders_timezone is not null and
        reminders_weekdays_only is not null)
      or
      (not reminders_active and
        reminders_offset is null and
        reminders_time is null and
        reminders_timezone is null and
        reminders_weekdays_only is null)
    )
  `);
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("reminders_config");
  });
}
