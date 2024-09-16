import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field_reply 
    set metadata = metadata || jsonb_build_object('inferred_type', upper("metadata"->>'inferred_type'))
    where type = 'ES_TAX_DOCUMENTS' 
    and deleted_at is null 
    and anonymized_at is null 
    and "metadata"->>'inferred_type' is not null;  
  `);
}

export async function down(knex: Knex): Promise<void> {}
