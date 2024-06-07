import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.integer("automatic_reminders_left").notNullable().defaultTo(0);
  });

  await knex.raw(/* sql */ `
    update petition_access set automatic_reminders_left = reminders_left;

    -- create new index with automatic_reminders_left column to replace the old one
    create index petition_access__remindable_accesses 
      on petition_access (id)
      where 
        "status" = 'ACTIVE'::petition_access_status 
        and reminders_active = true
        and next_reminder_at is not null
        and reminders_left > 0
        and automatic_reminders_left > 0;

    drop index petition_access__remindable_accesses_idx;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_access", (t) => {
    t.dropColumn("automatic_reminders_left");
  });

  await knex.raw(/* sql */ `
    create index petition_access__remindable_accesses_idx
      on petition_access (id)
      where
        "status" = 'ACTIVE'::petition_access_status
        and reminders_active = true
        and next_reminder_at is not null
        and reminders_left > 0;
  `);
}

export const config = {
  transaction: false,
};
