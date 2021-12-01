import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
  drop index user__organization_role__owner;
  alter type user_organization_role rename to user_organization_role_old;

  create type user_organization_role as enum ('COLLABORATOR', 'NORMAL', 'ADMIN', 'OWNER');

  alter table "user" 
    alter column "organization_role" drop default,
    alter column "organization_role" type user_organization_role using "organization_role"::varchar::user_organization_role,
    alter column "organization_role" set default 'NORMAL'::user_organization_role;

  drop type user_organization_role_old;

  create unique index "user__organization_role__owner" on "user" ("org_id") where organization_role = 'OWNER' and deleted_at is null
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index user__organization_role__owner;
    alter type user_organization_role rename to user_organization_role_old;

    create type user_organization_role as enum ('NORMAL', 'ADMIN', 'OWNER');

    update "user" set organization_role = 'NORMAL' where organization_role = 'COLLABORATOR';

    alter table "user" 
      alter column "organization_role" drop default,
      alter column "organization_role" type user_organization_role using "organization_role"::varchar::user_organization_role,
      alter column "organization_role" set default 'NORMAL'::user_organization_role;

    drop type user_organization_role_old;

    create unique index "user__organization_role__owner" on "user" ("org_id") where organization_role = 'OWNER' and deleted_at is null
  `);
}
