import * as Knex from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "HIDE_RECIPIENT_VIEW_CONTENTS", false);
  await knex.schema.alterTable("petition", (t) => {
    t.boolean("hide_recipient_view_contents").notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "HIDE_RECIPIENT_VIEW_CONTENTS");
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("hide_recipient_view_contents");
  });
}
