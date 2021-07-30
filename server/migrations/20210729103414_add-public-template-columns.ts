import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.specificType("public_categories", "text[]");
    t.jsonb("public_metadata");
  }).raw(/* sql */ `
      create unique index "petition__public_metadata__slug" on "petition" (("public_metadata" ->> 'slug')) where "template_public" is true and "deleted_at" is null
  `);
  // .raw(/* sql */ `
  //     alter table "petition" add constraint "petition__is_template__public_metadata" check (
  //       (not "is_template") or ("is_template" and "template_public" and ("public_metadata"->>'slug') is not null)
  //     )`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .raw(`drop index "petition__public_metadata__slug"`)
    .alterTable("petition", (t) => {
      t.dropColumn("public_metadata");
      t.dropColumn("public_categories");
    });
}
