import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.integer("temporary_file_document_id").nullable().references("temporary_file.id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("temporary_file_document_id");
  });
}
