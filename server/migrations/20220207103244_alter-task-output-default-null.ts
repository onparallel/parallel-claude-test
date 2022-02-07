import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.jsonb("output").nullable().defaultTo(null).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("task", (t) => {
    t.jsonb("output").notNullable().defaultTo(knex.raw("'{}'::jsonb")).alter();
  });
}
