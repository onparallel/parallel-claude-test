import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(/* sql */ `
    alter type "petition_signature_cancel_reason" add value 'REQUEST_RESTARTED';
  `);
}

export async function down(knex: Knex): Promise<void> {
  const newEnum = ["CANCELLED_BY_USER", "DECLINED_BY_SIGNER", "REQUEST_ERROR"];

  await knex.raw(/* sql */ `
    alter type petition_signature_cancel_reason rename to petition_signature_cancel_reason_old;
    create type petition_signature_cancel_reason as enum (${newEnum
      .map((value) => `'${value}'`)
      .join(",")});

    delete from petition_signature_request where cancel_reason = 'REQUEST_RESTARTED';
    alter table petition_signature_request alter column "cancel_reason" type petition_signature_cancel_reason using "cancel_reason"::varchar::petition_signature_cancel_reason;
    drop type petition_signature_cancel_reason_old;
  `);
}
