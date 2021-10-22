import { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await addIntegrationType(knex, "EVENT_SUBSCRIPTION");
  await knex.schema.alterTable("org_integration", (t) => {
    timestamps(t);
  });
  await knex.raw(/* sql */ `
    alter table org_integration drop constraint "org_integration__org_id__type__provider";
    create unique index "org_integration__org_id__type__provider" on "org_integration" ("org_id", "type", "provider") where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('drop index "org_integration__org_id__type__provider"');
  await knex.schema.alterTable("org_integration", (t) => {
    t.dropColumns(
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
      "deleted_at",
      "deleted_by"
    );
    t.unique(["org_id", "type", "provider"], "org_integration__org_id__type__provider");
  });

  await knex.raw(/* sql */ `
    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);
  await removeIntegrationType(knex, "EVENT_SUBSCRIPTION");
  await knex.raw(/* sql */ `
    CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
    CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
  `);
}
