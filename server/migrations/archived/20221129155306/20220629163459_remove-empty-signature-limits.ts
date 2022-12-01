import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* SQL */ `
    delete from organization_usage_limit where "limit_name" = 'SIGNATURIT_SHARED_APIKEY' and "limit" = 0 and "used" = 0;
    `);
}

export async function down(knex: Knex): Promise<void> {}
