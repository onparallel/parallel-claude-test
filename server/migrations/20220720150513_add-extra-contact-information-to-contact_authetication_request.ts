import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact_authentication_request", (t) => {
    t.text("contact_first_name").nullable().defaultTo(null);
    t.text("contact_last_name").nullable().defaultTo(null);
    t.text("contact_email").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact_authentication_request", (t) => {
    t.dropColumn("contact_first_name");
    t.dropColumn("contact_last_name");
    t.dropColumn("contact_email");
  });
}
