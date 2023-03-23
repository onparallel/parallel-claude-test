import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type user_status add value 'ON_HOLD';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update "user" u
    set "status" = 'INACTIVE'
    where "status" = 'ON_HOLD';
  `);

  await knex.raw(/* sql */ `

    alter type user_status rename to user_status_old;
    create type user_status as enum ('ACTIVE', 'INACTIVE');
  
    alter table "user" alter column "status" drop default;
    alter table "user" alter column "status" type user_status using "status"::varchar::user_status;
    alter table "user" alter column "status" set default 'ACTIVE';
    
    drop type user_status_old;
  `);
}
