import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update org_integration 
    set settings = settings - '_CREDENTIALS' 
    where type = 'SIGNATURE' and provider = 'SIGNATURIT' and settings->'_CREDENTIALS' is not null;
  `);
}

export async function down(knex: Knex): Promise<void> {}
