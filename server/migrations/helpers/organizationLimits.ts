import { Knex } from "knex";

export async function addOrganizationUsageLimit(knex: Knex, name: string) {
  await knex.schema.raw(/* sql */ `
    alter type "organization_usage_limit_name" add value '${name}';
  `);
}

export async function removeOrganizationUsageLimit(knex: Knex, name: string) {
  const { rows } = await knex.raw<{
    rows: { limit_name: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::organization_usage_limit_name)) as limit_name;
  `);

  await knex.raw(/* sql */ `
    alter type organization_usage_limit_name rename to organization_usage_limit_name_old;
    create type organization_usage_limit_name as enum (${rows
      .map((r) => r.limit_name)
      .filter((f) => f !== name)
      .map((f) => `'${f}'`)
      .join(",")});

    delete from organization_usage_limit where limit_name = '${name}';
    alter table organization_usage_limit alter column "limit_name" type organization_usage_limit_name using "limit_name"::varchar::organization_usage_limit_name;
    drop type organization_usage_limit_name_old;
  `);
}
