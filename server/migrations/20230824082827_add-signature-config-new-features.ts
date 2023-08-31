import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition 
    set signature_config = signature_config || jsonb_build_object(
        'minSigners', 1,
        'signingMode', 'PARALLEL'
    )
    where signature_config is not null;

    update petition_signature_request
    set signature_config = signature_config || jsonb_build_object(
        'minSigners', 1,
        'signingMode', 'PARALLEL'
    );
`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition
    set signature_config = signature_config - 'minSigners' - 'signingMode'
    where signature_config is not null;

    update petition_signature_request
    set signature_config = signature_config - 'minSigners' - 'signingMode';
  `);
}
