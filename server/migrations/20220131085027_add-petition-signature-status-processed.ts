import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    start transaction;
    alter type "petition_signature_status" add value 'PROCESSED' after 'PROCESSING';
    commit;
  `);

  // every 'PROCESSING' row is now 'PROCESSED'
  await knex
    .from("petition_signature_request")
    .where({ status: "PROCESSING" })
    .update({ status: "PROCESSED" });

  await knex.raw(/* sql */ `
    drop index petition_signature_request__petition_id_processing_uniq;

    create unique index petition_signature_request__petition_id_processing_uniq on petition_signature_request (petition_id)
    where (status = ANY (ARRAY ['ENQUEUED'::petition_signature_status, 'PROCESSING'::petition_signature_status, 'PROCESSED'::petition_signature_status]));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    drop index petition_signature_request__petition_id_processing_uniq;
    alter table petition_signature_request drop constraint petition_signature_request__cancel_reason_data_check;
  `);

  await knex
    .from("petition_signature_request")
    .where({ status: "PROCESSED" })
    .update({ status: "PROCESSING" });

  await knex.raw(/* sql */ `
    alter type petition_signature_status rename to petition_signature_status_old;
    create type petition_signature_status as enum ('ENQUEUED', 'PROCESSING', 'CANCELLED', 'COMPLETED');
    alter table petition_signature_request 
      alter column "status" drop default,
      alter column "status" type petition_signature_status using "status"::varchar::petition_signature_status,
      alter column "status" set default 'ENQUEUED'::petition_signature_status;

    drop type petition_signature_status_old;
  `);

  await knex.raw(/* SQL */ `
    create unique index petition_signature_request__petition_id_processing_uniq on petition_signature_request (petition_id)
    where (status = ANY (ARRAY ['ENQUEUED'::petition_signature_status, 'PROCESSING'::petition_signature_status]));

    alter table petition_signature_request 
    add constraint petition_signature_request__cancel_reason_data_check 
    check (
      (status = 'CANCELLED' and cancel_reason is not null and cancel_data is not null) 
      or 
      (status <> 'CANCELLED' and cancel_reason is null and cancel_data is null)
    )
  `);
}
