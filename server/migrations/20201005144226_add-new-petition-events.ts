import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(/* sql */ `
  alter type "petition_event_type" add value 'PETITION_CLOSED';
  `);
}

export async function down(knex: Knex): Promise<void> {}
