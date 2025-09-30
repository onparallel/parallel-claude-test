import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.string("default_timezone", 50).notNullable().defaultTo("Etc/UTC").alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.string("default_timezone", 50).nullable().defaultTo("Etc/UTC").alter();
  });
}
