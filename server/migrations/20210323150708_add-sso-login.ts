import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("org_domain", (t) => {
    t.increments("id");
    t.integer("org_id").references("organization.id");
    t.string("domain").unique().notNullable();
  });

  await knex.schema.alterTable("organization", (t) => {
    t.string("sso_provider", 64);
  });

  await knex.schema.alterTable("user", (t) => {
    t.boolean("is_sso_user").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("org_domain");
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("sso_provider");
  });
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("is_sso_user");
  });
}
