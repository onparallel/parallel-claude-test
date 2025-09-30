import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "SETTING_DELEGATE_ACCESS", false);
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("enable_delegate_access").notNullable().defaultTo(true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "SETTING_DELEGATE_ACCESS");
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("enable_delegate_access");
  });
}
