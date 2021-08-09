import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.raw(`alter type "petition_status" add value 'READY' before 'COMPLETED'`);
}

export async function down(knex: Knex): Promise<any> {}
