import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update profile_field_value 
    set content = jsonb_build_object('value', ("content"->>'value')::numeric)
    where type = 'NUMBER';
  `);
}

export async function down(knex: Knex): Promise<void> {}
