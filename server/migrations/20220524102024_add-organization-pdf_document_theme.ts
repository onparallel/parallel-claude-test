import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.jsonb("pdf_document_theme").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.dropColumn("pdf_document_theme");
  });
}
