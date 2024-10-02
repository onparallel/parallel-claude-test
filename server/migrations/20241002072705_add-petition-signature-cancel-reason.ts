import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    alter type petition_signature_cancel_reason add value 'REQUEST_EXPIRED';
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex
    .from("petition_signature_request")
    .where("cancel_reason", "REQUEST_EXPIRED")
    .update({ cancel_reason: "REQUEST_ERROR" });

  await knex.raw(/* sql */ `
    alter type petition_signature_cancel_reason rename to petition_signature_cancel_reason_old;
    create type petition_signature_cancel_reason as enum (${[
      "CANCELLED_BY_USER",
      "DECLINED_BY_SIGNER",
      "REQUEST_ERROR",
      "REQUEST_RESTARTED",
    ]
      .map((f) => `'${f}'`)
      .join(",")});
    alter table petition_signature_request alter column "cancel_reason" type petition_signature_cancel_reason using "cancel_reason"::varchar::petition_signature_cancel_reason;
    drop type petition_signature_cancel_reason_old;
  `);
}
