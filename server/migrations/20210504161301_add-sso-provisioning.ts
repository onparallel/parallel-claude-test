import { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.string("external_id");
  });

  await knex.raw(/* sql */ `
    create unique index "user__org_id__external_id" on "user" ("org_id", "external_id") where "deleted_at" is null`);

  await addIntegrationType(knex, "USER_PROVISIONING");

  await knex.raw(/* sql */ `
    create index org_integration___user_provisioning_auth_key__index
    on org_integration (((settings ->> 'AUTH_KEY')::text))
    where type = 'USER_PROVISIONING';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("external_id");
  });

  await knex.raw(/* sql */ `
    drop index org_integration___user_provisioning_auth_key__index;
    drop index org_integration___sso_email_domains__index;
  `);

  await removeIntegrationType(knex, "USER_PROVISIONING");

  await knex.raw(/* sql */ `
    create index org_integration___sso_email_domains__index 
    on org_integration USING gin ((settings#>'{EMAIL_DOMAINS}'::text[]))
    where type = 'SSO';
`);
}

export const config = {
  transaction: false,
};
