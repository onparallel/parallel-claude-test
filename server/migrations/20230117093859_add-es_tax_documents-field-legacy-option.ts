import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set options = options || jsonb_build_object('legacy', true) where type = 'ES_TAX_DOCUMENTS';
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set options = options - 'legacy' where type = 'ES_TAX_DOCUMENTS';
`);
}
