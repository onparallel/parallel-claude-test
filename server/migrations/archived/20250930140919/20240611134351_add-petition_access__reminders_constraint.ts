import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_access 
    add constraint petition_access__reminders_limit
    check (reminders_left >= automatic_reminders_left)
    not valid;
   
    alter table petition_access
    validate constraint petition_access__reminders_limit;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter table petition_access 
    drop constraint petition_access__reminders_limit;
  `);
}

export const config = {
  transaction: false,
};
