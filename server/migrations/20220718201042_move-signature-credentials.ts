import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // settings->>'API_KEY' value is @deprecated from now and should not be used anymore.
  // instead it will be moved to settings->'CREDENTIALS'->>'API_KEY' on Signaturit rows
  // old value settings->>'API_KEY' will be kept for retrocompatibility on release, and should be removed after some time
  await knex.raw(/* sql */ `
    update org_integration set
    settings = settings || jsonb_build_object('CREDENTIALS', jsonb_build_object('API_KEY', settings->>'API_KEY'))
    where "provider" = 'SIGNATURIT' and settings->>'API_KEY' is not null
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update org_integration set
    settings = settings - 'CREDENTIALS' || jsonb_build_object('API_KEY', settings->'CREDENTIALS'->>'API_KEY')
    where "provider" = 'SIGNATURIT' and settings->>'CREDENTIALS' is not null
  `);
}
