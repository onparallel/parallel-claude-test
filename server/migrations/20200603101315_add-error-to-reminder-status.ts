import * as Knex from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    alter type petition_reminder_status add value 'ERROR';
  `);
}

export async function down(knex: Knex): Promise<any> {}
