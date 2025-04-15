import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile", (table) => {
    table.jsonb("value_cache").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile", (table) => {
    table.dropColumn("value_cache");
  });
}
