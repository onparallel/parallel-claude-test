import { Knex } from "knex";

/*
default user limit changed from 1 to 2.
so we need to update existing organizations that have user_limit = 1
*/
export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update organization set usage_details = usage_details || '{"USER_LIMIT": 2}' where (usage_details->>'USER_LIMIT')::int = 1 and deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update organization set usage_details = usage_details || '{"USER_LIMIT": 1}' where (usage_details->>'USER_LIMIT')::int = 2 and deleted_at is null;
  `);
}
