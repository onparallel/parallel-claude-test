import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
      create index "petition_access__remindable_accesses_idx" on petition_access (id) 
      where (
        "status" = 'ACTIVE'
        and "reminders_active" = true
        and "next_reminder_at" is not null
        and "reminders_left" > 0
      );
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition_access__remindable_accesses_idx";
  `);
}
