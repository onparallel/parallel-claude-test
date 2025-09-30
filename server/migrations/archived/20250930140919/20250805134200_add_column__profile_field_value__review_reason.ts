import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.jsonb("review_reason").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.dropColumn("review_reason");
  });
}
