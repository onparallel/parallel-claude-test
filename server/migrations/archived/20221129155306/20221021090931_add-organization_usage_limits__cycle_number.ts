import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization_usage_limit", (t) => {
    t.integer("cycle_number").notNullable().defaultTo(1);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization_usage_limit", (t) => {
    t.dropColumn("cycle_number");
  });
}
