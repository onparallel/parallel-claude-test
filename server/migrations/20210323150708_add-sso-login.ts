import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("org_domain", (t) => {
    t.increments("id");
    t.integer("org_id").references("organization.id");
    t.string("domain").unique().notNullable();
    t;
  });

  await knex.schema.alterTable("organization", (t) => {
    t.string("sso_provider", 64);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("org_domain");
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("sso_provider");
  });
}
