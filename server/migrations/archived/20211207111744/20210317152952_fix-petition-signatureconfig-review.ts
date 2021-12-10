import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `  
    update petition 
    set signature_config = signature_config || '{"review": false}' 
    where signature_config is not null and signature_config->>'review' is null;
`);
}

export async function down(knex: Knex): Promise<void> {}
