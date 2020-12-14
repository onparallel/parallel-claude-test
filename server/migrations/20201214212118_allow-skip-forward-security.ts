import * as Knex from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "SKIP_FORWARD_SECURITY", false);
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("skip_forward_security").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "SKIP_FORWARD_SECURITY");
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("skip_forward_security");
  });
}
