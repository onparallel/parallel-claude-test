import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "CUSTOM_HOST_UI", false);

  const organizations = await knex
    .from("organization")
    .whereNotNull("custom_host")
    .andWhere("deleted_at", null)
    .select("*");

  if (organizations.length) {
    await knex("feature_flag_override").insert(
      organizations.map((org) => ({
        feature_flag_name: "CUSTOM_HOST_UI",
        org_id: org.id,
        value: true,
      }))
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "CUSTOM_HOST_UI");
}
