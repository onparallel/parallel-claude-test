import { Knex } from "knex";
import { defaultBrandTheme } from "../src/util/BrandTheme";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type organization_theme_type add value 'BRAND';
    commit;
  `);

  await knex.raw(
    /* sql */ `
    insert into "organization_theme" (org_id, name, type, is_default, data)
    select
    id,
    'Default',
    'BRAND',
    true,
    jsonb_build_object(
      'color', coalesce(brand_theme->>'color', ?),
      'fontFamily', coalesce(brand_theme->>'fontFamily', ?)
    )
    from "organization" order by id
    `,
    [defaultBrandTheme.color, defaultBrandTheme.fontFamily]
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
       update organization o
        set brand_theme = ot.data
        from organization_theme ot
        where o.id = ot.org_id and ot.type = 'BRAND' and ot.deleted_at is null
    `);

  await knex.raw(/* sql */ `
    delete from organization_theme where type = 'BRAND';
    `);

  await knex.raw(/* sql */ `
      alter type organization_theme_type rename to organization_theme_type_old;
      create type organization_theme_type as enum ('PDF_DOCUMENT');
      
      alter table organization_theme alter column "type" type organization_theme_type using "type"::varchar::organization_theme_type;
      drop type organization_theme_type_old;
    `);
}
