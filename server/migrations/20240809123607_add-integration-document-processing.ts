import type { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addIntegrationType(knex, "DOCUMENT_PROCESSING");

  await knex.schema.createTable("document_processing_log", (t) => {
    t.increments("id");
    t.string("external_id").nullable();
    t.integer("integration_id").references("org_integration.id").notNullable();
    t.integer("file_upload_id").references("file_upload.id").notNullable();
    t.enum("document_type", ["PAYSLIP"], {
      useNative: true,
      enumName: "document_processing_type",
    }).notNullable();
    t.jsonb("raw_result").nullable();
    t.jsonb("error").nullable();
    t.jsonb("metadata").notNullable().defaultTo("{}");
    timestamps(t, { deleted: false });
  });

  await knex.raw(/* sql */ `
    create unique index document_processing_log__external_id on document_processing_log (external_id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("document_processing_log");
  await knex.raw(/* sql */ `
    drop type if exists document_processing_type;
  `);

  await knex.raw(/* sql */ `
    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);
  await removeIntegrationType(knex, "DOCUMENT_PROCESSING");
  await knex.raw(/* sql */ `
    CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
    CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
`);

  await knex.raw(/* sql */ `
    update petition_field
    set options = options - 'documentProcessing'
    where type = 'FILE_UPLOAD'
    and deleted_at is null;  
  `);
}
