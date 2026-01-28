import type { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await removeFeatureFlag(knex, "KEY_PROCESSES");
  await removeFeatureFlag(knex, "CUSTOM_PROPERTIES");
  await removeFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_DATA");
  await removeFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI");

  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("custom_properties");
  });

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.dropColumn("prefill_secret");
  });

  await knex.schema.dropTable("public_petition_link_prefill_data");
}

export async function down(knex: Knex): Promise<void> {
  await addFeatureFlag(knex, "KEY_PROCESSES");
  await addFeatureFlag(knex, "CUSTOM_PROPERTIES");
  await addFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_DATA");
  await addFeatureFlag(knex, "PUBLIC_PETITION_LINK_PREFILL_SECRET_UI");

  await knex.schema.alterTable("petition", (t) => {
    t.jsonb("custom_properties").notNullable().defaultTo(knex.raw("'{}'::jsonb"));
  });

  await knex.schema.alterTable("public_petition_link", (t) => {
    t.string("prefill_secret").nullable().defaultTo(null);
  });

  await knex.schema.createTable("public_petition_link_prefill_data", (t) => {
    t.increments("id");
    t.integer("template_id").notNullable().references("petition.id");
    t.string("keycode").notNullable();
    t.jsonb("data").notNullable().defaultTo("{}");
    t.text("path").notNullable().defaultTo("/");
    timestamps(t, { updated: false });
  });

  await knex.raw(/* sql*/ `
    create index "public_petition_link_prefill_data__keycode" on "public_petition_link_prefill_data" ("keycode") where deleted_at is null;
  `);
}
