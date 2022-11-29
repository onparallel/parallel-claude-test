import { Knex } from "knex";
import { defaultPdfDocumentTheme } from "../src/util/PdfDocumentTheme";
import { timestamps } from "./helpers/timestamps";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("organization_theme", (t) => {
    t.increments("id");
    t.integer("org_id").notNullable().references("organization.id");
    t.string("name").notNullable();
    t.enum("type", ["PDF_DOCUMENT"], {
      useNative: true,
      enumName: "organization_theme_type",
    }).notNullable();
    t.boolean("is_default").notNullable().defaultTo(false);
    t.jsonb("data").notNullable();
    timestamps(t);
  });

  await knex.raw(/* sql */ `
    -- default themes cannot be deleted
    alter table "organization_theme" 
    add constraint "organization_theme__is_default__deleted_at__check" 
    check ((is_default = true and deleted_at is null) or (is_default = false));

    -- at most 1 default theme on (org_id, type)
    create unique index "organization_theme__org_id__type__is_default" on "organization_theme" ("org_id", "type") where is_default and deleted_at is null;

    -- make it easy to get themes for organizations
    create index "organization_theme__org_id__type" on "organization_theme" ("org_id", "type");
  `);

  // populate table with custom or default theme for every org
  const result = await knex.raw(
    /* sql */ `
    insert into "organization_theme" (org_id, name, type, is_default, data)
    select
      id,
      name,
      'PDF_DOCUMENT',
      true,
      coalesce(pdf_document_theme, ?::jsonb)
    from "organization" order by id
    returning id, org_id;
  `,
    [JSON.stringify(defaultPdfDocumentTheme)]
  );

  await knex.schema.alterTable("petition", (t) => {
    t.integer("document_organization_theme_id").nullable().references("organization_theme.id");
  });

  // populate new column on petitions table with the id of recently created default themes
  const themes = result.rows as Array<{ id: number; org_id: number }>;
  if (themes.length > 0) {
    await knex.raw(/* sql */ `
    update petition p set document_organization_theme_id = t.id
    from "organization_theme" t
    where p.org_id = t.org_id
  `);
  }

  // mark column as not nullable
  await knex.schema.alterTable("petition", (t) => {
    t.integer("document_organization_theme_id").notNullable().alter();
  });

  await knex.raw(/* sql */ `
    -- useful for OrganizationRepository.deleteOrganizationTheme (restore to default when theme is deleted)
    create index "petition__org_id__document_organization_theme_id" on "petition" (org_id, document_organization_theme_id) where deleted_at is null;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition", (t) => {
    t.dropColumn("document_organization_theme_id");
  });

  await knex.schema.dropTable("organization_theme");

  await knex.raw(/* sql*/ `
    drop type "organization_theme_type";
  `);
}
