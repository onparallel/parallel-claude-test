import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_relationship", (t) => {
    t.integer("created_by_integration_id").nullable().references("org_integration.id");
    t.integer("created_by_user_id").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_relationship", (t) => {
    t.dropColumn("created_by_integration_id");
    t.integer("created_by_user_id").notNullable().alter();
  });
}
