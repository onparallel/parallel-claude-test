import { Knex } from "knex";

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
      coalesce(brand_theme, ?::jsonb)
    from "organization" order by id
  `,
    [JSON.stringify({})]
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        with subquery as 
        (select org_id, data from organization_theme where type = 'BRAND' and deleted_at is null)
        update organization
        set brand_theme = subquery.data
        from subquery
        where id = subquery.org_id
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
