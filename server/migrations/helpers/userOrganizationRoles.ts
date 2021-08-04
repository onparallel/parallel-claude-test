import { Knex } from "knex";

export async function addUserOrganizationRole(knex: Knex, roleName: string) {
  await knex.schema.raw(/* sql */ `
    alter type "user_organization_role" add value '${roleName}';
  `);
}

export async function removeUserOrganizationRole(
  knex: Knex,
  roleName: string,
  replaceWithRole: string
) {
  const { rows } = await knex.raw<{
    rows: { user_role: string }[];
  }>(/* sql */ `
    select unnest(enum_range(null::user_organization_role)) as user_role;
  `);

  await knex.raw(/* sql */ `
    alter type user_organization_role rename to user_organization_role_old;
    create type user_organization_role as enum (${rows
      .map((r) => r.user_role)
      .filter((f) => f !== roleName)
      .map((f) => `'${f}'`)
      .join(",")});

    update "user" set organization_role = '${replaceWithRole}' where organization_role = '${roleName}';

    alter table "user" 
      alter column "organization_role" drop default,
      alter column "organization_role" type user_organization_role using "organization_role"::varchar::user_organization_role,
      alter column "organization_role" set default 'NORMAL'::user_organization_role;

    drop type user_organization_role_old;
  `);
}
