import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    create index "petition__template_public__id" 
    on "petition" ("id") 
    where deleted_at is null and template_public;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "petition__template_public__id" 
  `);
}
