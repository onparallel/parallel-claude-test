import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `  
    update contact 
    set first_name = trim(first_name), last_name = trim(last_name) 
    where first_name ~ '^\s|\s$' or last_name ~ '^\s|\s$'
    `);

  await knex.raw(/* sql */ `  
    update user_data 
    set first_name = trim(first_name), last_name = trim(last_name) 
    where first_name ~ '^\s|\s$' or last_name ~ '^\s|\s$'
    `);
}

export async function down(knex: Knex): Promise<void> {}
