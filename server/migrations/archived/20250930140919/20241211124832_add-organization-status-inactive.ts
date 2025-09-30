import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter type "organization_status" add value 'INACTIVE';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update organization set status = 'CHURNED' where status = 'INACTIVE';

    drop index organization__status__root__unique;

    alter type organization_status rename to organization_status_old;
    create type organization_status as enum ('DEV', 'DEMO', 'ACTIVE', 'CHURNED', 'ROOT');

    alter table organization alter column "status" type organization_status using "status"::varchar::organization_status;
    drop type organization_status_old;

    create unique index organization__status__root__unique 
    on organization (status) 
    where status = 'ROOT'::organization_status 
    and deleted_at is null;
  `);
}
