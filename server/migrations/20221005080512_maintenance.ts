import { Knex } from "knex";
import { addFeatureFlag, removeFeatureFlag } from "./helpers/featureFlags";

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .alterTable("organization", (t) => {
      t.dropColumns("brand_theme", "preferred_tone", "pdf_document_theme");
    })
    .raw(/* sql */ `drop type tone`);

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.dropColumns("content");
  });

  await removeFeatureFlag(knex, "TEMPLATE_REPLIES_RECIPIENT_URL");

  knex.schema.raw(/* sql */ `
    update petition_signature_request set signature_config = (signature_config::jsonb - 'API_KEY')::jsonb
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("organization", (t) => {
    t.jsonb("brand_theme").nullable();
    t.enum("preferred_tone", ["FORMAL", "INFORMAL"], {
      useNative: true,
      enumName: "tone",
    })
      .notNullable()
      .defaultTo("INFORMAL");
    t.jsonb("pdf_document_theme").nullable();
  });

  await knex.schema.alterTable("petition_field_comment", (t) => {
    t.text("content").notNullable();
  });

  await addFeatureFlag(knex, "TEMPLATE_REPLIES_RECIPIENT_URL", false);
}
