import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_field set "options" = "options" || jsonb_build_object('attachToPdf', false) where "type" in ('FILE_UPLOAD', 'ES_TAX_DOCUMENTS') and ("options"->>'attachToPdf') is null;
    `);
}

export async function down(knex: Knex): Promise<void> {}
