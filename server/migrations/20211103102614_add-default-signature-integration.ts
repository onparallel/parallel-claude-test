import { Knex } from "knex";
import { difference } from "remeda";
import { Organization, OrgIntegration } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("org_integration", (t) => {
    t.boolean("is_default").notNullable().defaultTo(false);
    t.string("name").nullable();
  });
  await knex.raw(/* sql */ `
    update org_integration
    set "name" = INITCAP("provider")
  `);
  await knex.raw(
    /* sql */ `
      update org_integration set "name" = 'Signaturit Sandbox'
      where (settings->>'API_KEY')::text = ?
    `,
    [process.env.SIGNATURIT_SANDBOX_API_KEY!]
  );
  await knex.schema.alterTable("org_integration", (t) => {
    t.string("name").notNullable().alter();
  });

  const organizations = await knex
    .from<Organization>("organization")
    .whereNull("deleted_at")
    .select("*");

  const integrations = await knex
    .from<OrgIntegration>("org_integration")
    .where({ type: "SIGNATURE", deleted_at: null })
    .select("*");

  // there already are some integrations using the SIGNATURIT_SANDBOX_API_KEY, so we just need to enable those
  const existing = integrations.filter(
    (i) => i.settings.API_KEY === process.env.SIGNATURIT_SANDBOX_API_KEY
  );

  const orgsWithoutIntegration = difference(
    organizations.map((o) => o.id),
    existing.map((as) => as.org_id)
  );

  if (existing.length > 0) {
    await knex
      .from<OrgIntegration>("org_integration")
      .whereIn(
        "id",
        existing.map((e) => e.id)
      )
      .update({
        is_enabled: true,
        updated_at: knex.raw("CURRENT_TIMESTAMP"),
        updated_by: "Migration:20211103102614",
      });
  }

  if (orgsWithoutIntegration.length > 0) {
    await knex.from<OrgIntegration>("org_integration").insert(
      orgsWithoutIntegration.map((id) => ({
        org_id: id,
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        name: "Signaturit Sandbox",
        settings: { API_KEY: process.env.SIGNATURIT_SANDBOX_API_KEY, ENVIRONMENT: "sandbox" },
        is_enabled: true,
        is_default: true,
        created_by: `Migration:20211103102614`,
      }))
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("org_integration", (t) => {
    t.dropColumn("is_default");
    t.dropColumn("name");
  });
}
