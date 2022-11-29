import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("org_integration", (t) => {
    t.boolean("invalid_credentials").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("org_integration", (t) => {
    t.dropColumn("invalid_credentials");
  });
}
