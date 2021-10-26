import { Knex } from "knex";
import { addIntegrationType, removeIntegrationType } from "./helpers/integrationTypes";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.dropColumn("petition_id");
    t.boolean("is_enabled").notNullable().defaultTo(true);
  });
  await knex.from("petition_event_subscription").truncate();

  // migrate event subscriptions from org_integration to petition_event_subscription
  const orgIntegrationSubscriptions = await knex
    .from("org_integration")
    .where({ type: "EVENT_SUBSCRIPTION" });

  if (orgIntegrationSubscriptions.length > 0) {
    await knex.from("petition_event_subscription").insert(
      orgIntegrationSubscriptions.map((i) => ({
        user_id: i.settings.USER_ID,
        endpoint: i.settings.EVENTS_URL,
        is_enabled: i.is_enabled,
        created_by: i.created_by,
        created_at: i.created_at,
        updated_at: i.updated_at,
        updated_by: i.updated_by,
        deleted_at: i.deleted_at,
        deleted_by: i.deleted_by,
      }))
    );
  }

  await knex.from("org_integration").where("type", "EVENT_SUBSCRIPTION").delete();

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

export async function down(knex: Knex): Promise<void> {
  await addIntegrationType(knex, "EVENT_SUBSCRIPTION");
  await knex.from("petition_event_subscription").delete();
  await knex.schema.alterTable("petition_event_subscription", (t) => {
    t.integer("petition_id").references("petition.id").notNullable();
    t.index(["petition_id"], "petition_event_subscription__petition_id");

    t.dropColumn("is_enabled");
  });
}
