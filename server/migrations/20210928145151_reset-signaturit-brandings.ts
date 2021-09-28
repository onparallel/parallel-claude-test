import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // there is a new signaturit template email (SignatureReminderEmail) so we need to reset the branding ids to make sure this changes are reflected
  await knex.raw(/* sql */ `
    update org_integration 
    set settings = settings - 'ES_BRANDING_ID' - 'EN_BRANDING_ID'
    where type = 'SIGNATURE' and provider = 'SIGNATURIT'`);
}

export async function down(knex: Knex): Promise<void> {}
