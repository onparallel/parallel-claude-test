import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter type user_organization_role add value 'OWNER' before 'ADMIN';
  `);

  // first created user of each organization will be OWNER
  await knex.raw(/* sql */ `
    update "user" set organization_role = 'OWNER' where id in (
      select min(id) owner_id from "user" where deleted_at is null group by org_id
    )`);

  // each organization must have only one owner
  await knex.raw(/* sql */ `
    create unique index "user__organization_role__owner" on "user" ("org_id") where organization_role = 'OWNER' and deleted_at is null
  `);
}

export async function down(knex: Knex): Promise<void> {
  // drop owner constraint
  await knex.raw(/* sql */ `
    drop index "user__organization_role__owner";

    alter type user_organization_role rename to user_organization_role_old;

    create type user_organization_role as enum ('ADMIN', 'NORMAL');

    update "user" set organization_role = 'ADMIN' where organization_role = 'OWNER';

    alter table "user" 
      alter column "organization_role" drop default,
      alter column "organization_role" type user_organization_role using "organization_role"::varchar::user_organization_role,
      alter column "organization_role" set default 'NORMAL'::user_organization_role;

    drop type user_organization_role_old;
  `);
}

export const config = {
  transaction: false,
};
