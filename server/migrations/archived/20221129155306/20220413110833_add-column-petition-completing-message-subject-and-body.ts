import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("is_completing_message_enabled").notNullable().defaultTo(false);
    t.text("completing_message_subject").nullable().defaultTo(null);
    t.text("completing_message_body").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumns(
      "is_completing_message_enabled",
      "completing_message_subject",
      "completing_message_body"
    );
  });
}
