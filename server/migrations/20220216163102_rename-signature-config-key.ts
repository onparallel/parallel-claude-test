import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition set "signature_config" = "signature_config" - 'letRecipientsChooseSigners' || jsonb_build_object('allowAdditionalSigners', ("signature_config"->>'letRecipientsChooseSigners')::bool) where signature_config is not null;
    update petition_signature_request set "signature_config" = "signature_config" - 'letRecipientsChooseSigners' || jsonb_build_object('allowAdditionalSigners', ("signature_config"->>'letRecipientsChooseSigners')::bool) where signature_config is not null;    
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition set "signature_config" = "signature_config" - 'allowAdditionalSigners' || jsonb_build_object('letRecipientsChooseSigners', ("signature_config"->>'allowAdditionalSigners')::bool) where signature_config is not null;
    update petition_signature_request set "signature_config" = "signature_config" - 'allowAdditionalSigners' || jsonb_build_object('letRecipientsChooseSigners', ("signature_config"->>'allowAdditionalSigners')::bool) where signature_config is not null;
  `);
}
