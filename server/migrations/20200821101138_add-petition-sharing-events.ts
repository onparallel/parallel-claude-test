import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.raw(/* sql */ `
    alter type "petition_event_type" add value 'USER_PERMISSION_ADDED';
    alter type "petition_event_type" add value 'USER_PERMISSION_REMOVED';
    alter type "petition_event_type" add value 'USER_PERMISSION_EDITED';
    alter type "petition_event_type" add value 'OWNERSHIP_TRANSFERRED';
  `);
}

export async function down(knex: Knex): Promise<any> {}

export const config = {
  transaction: false,
};
