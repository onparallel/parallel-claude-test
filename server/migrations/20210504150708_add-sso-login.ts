import { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.boolean("is_sso_user").notNullable().defaultTo(false);
  });

  await addIntegrationType(knex, "SSO");

  await knex.raw(/* sql */ `
    create index org_integration___sso_email_domains__index 
    on org_integration USING gin ((settings#>'{EMAIL_DOMAINS}'::text[]))
    where type = 'SSO';
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("user", (t) => {
    t.dropColumn("is_sso_user");
  });
  await knex.raw(/* sql */ `
    DROP INDEX org_integration___sso_email_domains__index
  `);

  await removeIntegrationType(knex, "SSO");
}

export const config = {
  transaction: false,
};
