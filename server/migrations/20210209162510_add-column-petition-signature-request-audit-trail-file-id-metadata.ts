import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.integer("file_upload_audit_trail_id")
      .nullable()
      .references("file_upload.id");

    t.jsonb("metadata").notNullable().defaultTo(knex.raw("'{}'::json"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("file_upload_audit_trail_id");
    t.dropColumn("metadata");
  });
}
