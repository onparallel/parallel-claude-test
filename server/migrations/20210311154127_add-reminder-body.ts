import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_reminder", (t) => {
    t.text("email_body");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_reminder", (t) => {
    t.dropColumn("email_body");
  });
}
