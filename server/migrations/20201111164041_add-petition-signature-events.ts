import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.raw(/* sql */ `
    alter type "petition_event_type" add value 'SIGNATURE_STARTED';
    alter type "petition_event_type" add value 'SIGNATURE_COMPLETED';
    alter type "petition_event_type" add value 'SIGNATURE_CANCELLED';
    alter type "petition_event_type" add value 'SIGNATURE_DECLINED';
  `);
}

export async function down(knex: Knex): Promise<void> {}
