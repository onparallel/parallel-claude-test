import * as Knex from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("petition_signature_request", (t) => {
    t.increments("id");
    t.integer("petition_id").notNullable().references("petition.id");
    t.string("external_id");
    t.jsonb("signature_config").notNullable();
    t.enum("status", ["ENQUEUED", "PROCESSING", "CANCELLED", "COMPLETED"], {
      useNative: true,
      enumName: "petition_signature_status",
    })
      .notNullable()
      .defaultTo("ENQUEUED");
    t.enum(
      "cancel_reason",
      ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER", "REQUEST_ERROR"],
      {
        useNative: true,
        enumName: "petition_signature_cancel_reason",
      }
    ).nullable();
    t.jsonb("cancel_data").nullable();
    t.jsonb("data");
    t.jsonb("event_logs").defaultTo("[]");
    t.integer("file_upload_id").nullable().references("file_upload.id");
    t.timestamp("created_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP"));
    t.unique(["external_id"], "petition_signature_request__external_id");
    t.index(["petition_id"], "petition_signature_request__petition_id");
  }).raw(/* sql */ `
    CREATE UNIQUE INDEX "petition_signature_request__petition_id_processing_uniq" 
    ON "petition_signature_request" ("petition_id") 
    WHERE status in ('ENQUEUED', 'PROCESSING')
  `).raw(/* sql */ `
    alter table petition_signature_request 
    add constraint petition_signature_request__cancel_reason_data_check 
    check (
      (status = 'CANCELLED' and cancel_reason is not null and cancel_data is not null) 
      or 
      (status <> 'CANCELLED' and cancel_reason is null and cancel_data is null)
    )`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("petition_signature_request").raw(/* sql */ `
      drop type petition_signature_status;
      drop type petition_signature_cancel_reason;
    `);
}
