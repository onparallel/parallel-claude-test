import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("public_petition_link_prefill_data", (t) => {
    t.increments("id");
    t.integer("template_id").notNullable().references("petition.id");
    t.string("keycode").notNullable();
    t.jsonb("data").notNullable().defaultTo("{}");
    t.text("path").notNullable().defaultTo("/");
    timestamps(t, { updated: false });
  });

  await addFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_DATA", false);

  await knex.raw(/* sql*/ `
    -- for loadPublicPetitionLinkPrefillDataByKeycode
    create index "public_petition_link_prefill_data__keycode" on "public_petition_link_prefill_data" ("keycode") where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_DATA");

  await knex.schema.dropTable("public_petition_link_prefill_data");
}
