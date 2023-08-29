import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set signature_config = 
        jsonb_set(
            "signature_config",
            '{signersInfo}',
            (
                select jsonb_agg("signer" || '{"isPreset": true}')
                from jsonb_array_elements("signature_config"->'signersInfo') as "signer"
            )
        )
    where
	    is_template
        and anonymized_at is null
        and deleted_at is null
	    and signature_config is not null
	    and jsonb_array_length(signature_config->'signersInfo') > 0;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set signature_config = 
        jsonb_set(
            "signature_config",
            '{signersInfo}',
            (
                select jsonb_agg("signer" - 'isPreset')
                from jsonb_array_elements("signature_config"->'signersInfo') as "signer"
            )
        )
    where
	    is_template
        and anonymized_at is null
        and deleted_at is null
	    and signature_config is not null
	    and jsonb_array_length(signature_config->'signersInfo') > 0;
  `);
}
