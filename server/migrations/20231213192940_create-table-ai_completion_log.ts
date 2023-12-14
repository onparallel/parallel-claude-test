import { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { timestamps } from "./helpers/timestamps";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addTaskName, removeTaskName } from "./helpers/taskNames";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("ai_completion_log", (t) => {
    t.increments("id");
    t.integer("integration_id").references("org_integration.id").notNullable();
    t.enum("type", ["PETITION_SUMMARY"], {
      useNative: true,
      enumName: "ai_completion_log_type",
    }).notNullable();
    t.enum("status", ["PENDING", "COMPLETED", "FAILED"], {
      useNative: true,
      enumName: "ai_completion_log_status",
    })
      .notNullable()
      .defaultTo("PENDING");
    t.jsonb("request_params").notNullable();
    t.jsonb("raw_response").nullable();
    t.text("completion").nullable();
    t.jsonb("error").nullable();
    t.integer("request_tokens").nullable();
    t.integer("response_tokens").nullable();
    t.string("cost").nullable();
    timestamps(t, { deleted: false });
    t.timestamp("deprecated_at").nullable();
  }).raw(/* sql */ `
  alter table ai_completion_log 
    add constraint ai_completion_log__failed_error 
    check ((status = 'FAILED' and error is not null) or (status != 'FAILED'))
`);

  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("summary_config").nullable();
    t.integer("summary_ai_completion_log_id").references("ai_completion_log.id").nullable();
  });

  await addIntegrationType(knex, "AI_COMPLETION");
  await addFeatureFlag(knex, "PETITION_SUMMARY", false);
  await addTaskName(knex, "PETITION_SUMMARY");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumns("summary_config", "summary_ai_completion_log_id");
  });

  await knex.schema.dropTable("ai_completion_log");

  await knex.raw(/* sql */ `
    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);
  await removeIntegrationType(knex, "AI_COMPLETION");
  await knex.raw(/* sql */ `
    CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
    CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
`);

  await removeFeatureFlag(knex, "PETITION_SUMMARY");
  await removeTaskName(knex, "PETITION_SUMMARY");

  await knex.raw(/* sql */ `
    drop type "ai_completion_log_status";
    drop type "ai_completion_log_type";
  `);
}
