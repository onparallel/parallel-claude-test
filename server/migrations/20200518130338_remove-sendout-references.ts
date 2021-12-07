import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    alter table petition_reminder
      alter column petition_sendout_id drop not null;
  `);
  await knex.raw(/* sql */ `
    alter table petition_field_reply
      alter column petition_sendout_id drop not null;
  `);
}

export async function down(knex: Knex): Promise<any> {
  await knex.raw(/* sql */ `
    alter table petition_reminder
      alter column petition_sendout_id set not null;
  `);
  await knex.raw(/* sql */ `
    alter table petition_field_reply
      alter column petition_sendout_id set not null;
  `);
}
