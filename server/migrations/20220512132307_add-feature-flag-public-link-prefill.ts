import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI", false);

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.string("prefill_secret").nullable().defaultTo(null);
  });
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI");

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.dropColumn("prefill_secret");
  });
}
