import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type organization_theme_type add value 'BRAND';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
      alter type organization_theme_type rename to organization_theme_type_old;
      create type organization_theme_type as enum ('PDF_DOCUMENT');
      
      alter table organization_theme alter column "type" type organization_theme_type using "type"::varchar::organization_theme_type;
      drop type organization_theme_type_old;
    `);
}
