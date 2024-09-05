import type { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addIntegrationType(knex, "PROFILE_EXTERNAL_SOURCE");

  await knex.schema.createTable("profile_external_source_entity", (t) => {
    t.increments("id");
    t.integer("integration_id").references("org_integration.id").notNullable();
    t.jsonb("data").notNullable();
    t.specificType("standard_type", "profile_type_standard_type").notNullable();
    t.jsonb("parsed_data").notNullable().defaultTo("{}");
    t.integer("created_by_user_id").notNullable().references("user.id");
    timestamps(t, { updated: false, deleted: false });
  });

  await knex.schema.alterTable("profile_field_value", (t) => {
    t.integer("external_source_integration_id").references("org_integration.id").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("profile_field_value", (t) => {
    t.dropColumn("external_source_integration_id");
  });

  await knex.schema.dropTable("profile_external_source_entity");

  await knex.raw(/* sql */ `
    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);
  await removeIntegrationType(knex, "PROFILE_EXTERNAL_SOURCE");
  await knex.raw(/* sql */ `
    CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
    CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
  `);
}
