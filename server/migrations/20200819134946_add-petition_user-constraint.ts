import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  return await knex.raw(
    "ALTER TABLE petition_user ADD CONSTRAINT petition_user_unique UNIQUE (petition_id,user_id)"
  );
}

export async function down(knex: Knex): Promise<void> {
  return await knex.raw(
    "ALTER TABLE petition_user DROP CONSTRAINT petition_user_unique"
  );
}
