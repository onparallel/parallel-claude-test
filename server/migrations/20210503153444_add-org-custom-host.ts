import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.string("custom_host", 255).unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("custom_host");
  });
}
