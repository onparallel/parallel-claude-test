import * as Knex from "knex";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable("petition_signature_request", (t) => {
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
      t.integer("file_upload_id").nullable().references("file_upload.id");
      timestamps(t, { deleted: false });
    })
    .raw(
      "CREATE INDEX petition_signature_request_petition_id_idx ON petition_signature_request (petition_id)"
    )
    .raw(
      `create unique index "petition_signature_request_petition_id_unique" on "petition_signature_request" ("petition_id") where "status" = 'PROCESSING'`
    )
    .raw(
      "CREATE INDEX petition_signature_request_external_id_idx ON petition_signature_request (external_id)"
    )
    .raw(
      `create unique index "petition_signature_request_external_id_unique" on "petition_signature_request" ("external_id") where "status" = 'PROCESSING'`
    );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTable("petition_signature_request")
    .raw(/* sql */ `drop type petition_signature_status`);
}
