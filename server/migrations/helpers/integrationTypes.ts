import { Knex } from "knex";

export async function addIntegrationType(knex: Knex, type: string) {
  await knex.schema.raw(/* sql */ `
    alter type integration_type add value '${type}';
  `);
}

export async function removeIntegrationType(knex: Knex, type: string) {
  await knex.raw(/* sql */ `
    drop index org_integration___sso_email_domains__index;
    drop index org_integration___user_provisioning_auth_key__index;
  `);
  await knex.from("org_integration").where("type", type).delete();

  const { rows } = await knex.raw<{
    rows: { type: string }[];
  }>(/* sql */ `
    select unnest(enum_range(NULL::integration_type)) as "type"
  `);

  await knex.raw(/* sql */ `
    alter type integration_type rename to integration_type_old;
    create type integration_type as enum (${rows
      .map((r) => r.type)
      .filter((f) => f !== type)
      .map((f) => `'${f}'`)
      .join(",")});
    alter table org_integration alter column "type" type integration_type using "type"::varchar::integration_type;
    drop type integration_type_old;
  `);
  await knex.raw(/* sql */ `
    create index org_integration___sso_email_domains__index on org_integration using gin (((settings #> '{EMAIL_DOMAINS}'::text[]))) where (type = 'SSO'::integration_type);
    create index org_integration___user_provisioning_auth_key__index on org_integration using btree (((settings ->> 'AUTH_KEY'::text))) where (type = 'USER_PROVISIONING'::integration_type);
  `);
}
