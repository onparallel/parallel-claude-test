import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_signature_request", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.string("external_id");
    t.jsonb("signature_settings").notNullable();
    t.enum("status", ["PROCESSING", "CANCELLED", "COMPLETED"], {
      useNative: true,
      enumName: "petition_signature_status",
    })
      .notNullable()
      .defaultTo("PROCESSING");
    t.jsonb("data");
    t.specificType("event_logs", "jsonb[]").defaultTo("{}");
    t.integer("file_upload_id").nullable().references("file_upload.id");
    t.timestamp("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.unique(["external_id"], "petition_signature_request__external_id");
  }).raw(/* sql */ `
        CREATE UNIQUE INDEX "petition_signature_request__petition_id_processing_uniq" 
        ON "petition_signature_request" ("petition_id") 
        WHERE status = 'PROCESSING'
      `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("petition_signature_request")
    .raw(/* sql */ `drop type petition_signature_status`);
}
