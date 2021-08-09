import { Knex } from "knex";

export async function up(knex: Knex): Promise<any> {
  return knex.schema.alterTable("user", (t) => {
    t.jsonb("onboarding_status").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });
}

export async function down(knex: Knex): Promise<any> {
  return knex.schema.alterTable("user", (t) => {
    t.dropColumn("onboarding_status");
  });
}
