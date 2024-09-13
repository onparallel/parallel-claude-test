import type { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { addTaskName, removeTaskName } from "./helpers/taskNames";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addTaskName(knex, "FILE_EXPORT");
  await addIntegrationType(knex, "FILE_EXPORT");

  await knex.schema.createTable("file_export_log", (t) => {
    t.increments("id");
    t.integer("integration_id").references("org_integration.id").notNullable();
    t.jsonb("json_export").notNullable();
    t.integer("created_by_user_id").references("user.id").notNullable();
    t.jsonb("request_log").notNullable().defaultTo("[]");
    timestamps(t, { deleted: false });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("file_export_log");
  await knex.raw(/* sql */ `
    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);
  await removeIntegrationType(knex, "FILE_EXPORT");
  await knex.raw(/* sql */ `
    CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
    CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
`);
  await removeTaskName(knex, "FILE_EXPORT");
}
