import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";

export async function up(knex: Knex): Promise<void> {
  await addIntegrationType(knex, "DOW_JONES_KYC");
  await addFeatureFlag(knex, "DOW_JONES_KYC", false);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "DOW_JONES_KYC");
  await knex.raw(/* sql */ `
  drop index org_integration___sso_email_domains__index;
  drop index org_integration___user_provisioning_auth_key__index;
`);
  await removeIntegrationType(knex, "DOW_JONES_KYC");
  await knex.raw(/* sql */ `
  CREATE INDEX org_integration___sso_email_domains__index ON org_integration USING gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) WHERE (type = 'SSO'::integration_type);
  CREATE INDEX org_integration___user_provisioning_auth_key__index ON org_integration USING btree (((settings ->> 'AUTH_KEY'::text))) WHERE (type = 'USER_PROVISIONING'::integration_type);
`);
}
