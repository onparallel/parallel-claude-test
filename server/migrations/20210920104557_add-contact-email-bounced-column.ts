import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.boolean("last_email_bounced").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("contact", (t) => {
    t.dropColumn("last_email_bounced");
  });
}
