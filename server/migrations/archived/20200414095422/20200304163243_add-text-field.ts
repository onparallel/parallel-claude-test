import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.raw(`alter type "petition_field_type" add value 'TEXT'`);
}

export async function down(knex: Knex): Promise<any> {}
