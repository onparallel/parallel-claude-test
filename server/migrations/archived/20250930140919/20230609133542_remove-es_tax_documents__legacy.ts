import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
        update petition_field set options = options - 'legacy'
        where type = 'ES_TAX_DOCUMENTS' and ("options"->>'legacy')::boolean = false;
    `);
}

export async function down(knex: Knex): Promise<void> {}
