import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index "petition__org_id" on petition(org_id) include (status) where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition__org_id";
  `);
}
