import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Make it easier for the petition-notifications worker to find notifications to process
  await knex.raw(/* sql */ `
    create index petition_reminder__petition_access_id on petition_reminder (petition_access_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_reminder__petition_access_id
  `);
}
