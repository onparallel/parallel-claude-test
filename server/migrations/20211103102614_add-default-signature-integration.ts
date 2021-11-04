import { Knex } from "knex";
import pMap from "p-map";
import { Organization, OrgIntegration } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("org_integration", (t) => {
      t.boolean("is_default").notNullable().defaultTo(false);
      t.string("name").nullable();
    })
    .raw(
      /* sql */ `
    update org_integration set "name" = INITCAP("provider")
  `
    )
    .alterTable("org_integration", (t) => {
      t.string("name").notNullable().alter();
    });

  const organizations = await knex
    .from<Organization>("organization")
    .whereNull("deleted_at")
    .select("*");

  const currentSignatureIntegrations = await knex
    .from<OrgIntegration>("org_integration")
    .where({ type: "SIGNATURE", deleted_at: null })
    .select("*");

  // there already are some integrations using the SIGNATURIT_SANDBOX_API_KEY, so we just need to enable those
  const alreadySetted = currentSignatureIntegrations.filter(
    (i) => i.settings.API_KEY === process.env.SIGNATURIT_SANDBOX_API_KEY
  );

  await pMap(
    alreadySetted,
    async (i) => {
      await knex
        .from("org_integration")
        .where({ id: i.id })
        .update({
          is_enabled: true,
          settings: { ...i.settings, ENVIRONMENT: "sandbox" },
          name: "Signaturit Sandbox",
          updated_by: `Migration:20211103102614`,
          updated_at: new Date(),
        });
    },
    { concurrency: 1 }
  );

  const alreadySettedOrgIds = alreadySetted.map((as) => as.org_id);

  const newOrganizations = organizations.filter((o) => !alreadySettedOrgIds.includes(o.id));

  if (newOrganizations.length > 0) {
    await knex.from<OrgIntegration>("org_integration").insert(
      newOrganizations.map((o) => ({
        org_id: o.id,
        type: "SIGNATURE",
        provider: "SIGNATURIT",
        name: "Signaturit Sandbox",
        settings: { API_KEY: process.env.SIGNATURIT_SANDBOX_API_KEY, ENVIRONMENT: "sandbox" },
        is_enabled: true,
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
