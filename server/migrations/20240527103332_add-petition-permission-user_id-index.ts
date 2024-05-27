import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index petition_permission__user_id
      on petition_permission (user_id)
      where deleted_at is null and user_id is not null; 
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_permission__user_id
  `);
}
