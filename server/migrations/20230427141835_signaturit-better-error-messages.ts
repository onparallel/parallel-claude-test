import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    -- update old "account depleted" cancel_data to include new error_code "SIGNATURIT_ACCOUNT_DEPLETED_CREDITS"
    update petition_signature_request
    set cancel_data = cancel_data || jsonb_build_object(
      'error_code', 'SIGNATURIT_ACCOUNT_DEPLETED_CREDITS', 
      'error', 'Account depleted all it''s advanced signature requests'
    )
    where (cancel_data->>'error') ilike '%Account depleted all it%'
  `);
}

export async function down(knex: Knex): Promise<void> {}
