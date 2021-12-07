import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(/* sql */ `
    alter type "petition_event_type" add value 'PETITION_CLOSED';
    alter type "petition_event_type" add value 'PETITION_CLOSED_NOTIFIED';
  `);
}

export async function down(knex: Knex): Promise<void> {}
