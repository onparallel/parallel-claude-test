import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "DEVELOPER_ACCESS", false);

  await knex
    .from("feature_flag_override")
    .where("feature_flag_name", "API_TOKENS")
    .update({ feature_flag_name: "DEVELOPER_ACCESS" });

  await removeFeatureFlag(knex, "API_TOKENS");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "API_TOKENS", false);

  await knex
    .from("feature_flag_override")
    .where("feature_flag_name", "DEVELOPER_ACCESS")
    .update({ feature_flag_name: "API_TOKENS" });

  await removeFeatureFlag(knex, "DEVELOPER_ACCESS");
}
