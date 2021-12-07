import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type "organization_status" add value 'ROOT'`).raw(/* sql */ `
    
    -- only one organization should be ROOT
    create unique index "organization__status__root__unique" on "organization" ("status") where "status" = 'ROOT' and deleted_at is null`)
    .raw(/* sql */ `
    update "organization" set "status" = 'ROOT' where "name" = 'Parallel'; 
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index "organization__status__root__unique";
    alter type organization_status rename to organization_status_old;
    create type organization_status as enum ('ACTIVE', 'CHURNED', 'DEMO', 'DEV');

    update organization set "status" = 'DEV' where "status" = 'ROOT';
    alter table organization alter column "status" type organization_status using "status"::varchar::organization_status;
    drop type organization_status_old;
    `);
}

export const config = {
  transaction: false,
};
