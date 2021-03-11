import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.raw(
    `update petition_field set options = jsonb_set(options::jsonb, '{placeholder}', 'null')::json where type = 'TEXT'`
  );
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.raw(
    `update petition_field set options = (options::jsonb - 'placeholder')::json where type = 'TEXT'`
  );
}
