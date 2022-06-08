import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.integer("anonymize_after_days").nullable().defaultTo(null);
    t.text("anonymize_purpose").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumns("anonymize_after_days", "anonymize_purpose");
  });
}
