import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* SQL */ `
    alter table organization_usage_limit 
    add constraint organization_usage_limit__used__limit__check 
    check ("used" <= "limit");
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* SQL */ `
    alter table organization_usage_limit 
    drop constraint organization_usage_limit__used__limit__check;
  `);
}
