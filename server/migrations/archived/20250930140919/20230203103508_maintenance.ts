import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update org_integration 
        set settings = settings - 'API_KEY'
        where 
            settings->'API_KEY' is not null 
            and "type" = 'SIGNATURE' 
            and "provider" = 'SIGNATURIT'
    `);
}

export async function down(knex: Knex): Promise<void> {}
