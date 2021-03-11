import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.raw(/* sql */ `
      update petition set status = 'PENDING' where status = 'SCHEDULED';
    `).raw(/* sql */ `
      update petition set status = 'COMPLETED' where status = 'READY';
    `).raw(/* sql */ `
      alter type petition_status rename to old_petition_status;
    `).raw(/* sql */ `
      create type petition_status as enum ('DRAFT', 'PENDING', 'COMPLETED');
    `).raw(/* sql */ `
      alter table petition alter column "status" type petition_status using status::text::petition_status;
    `).raw(/* sql */ `
      drop type old_petition_status;
    `);
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.raw(/* sql */ `
    alter type petition_status add value 'SCHEDULED' before 'PENDING'
  `).raw(/* sql */ `
    alter type petition_status add value 'READY' before 'COMPLETED'
  `);
}
