import { Knex } from "knex";

//change some payloads on petition_signature_request and petition_event
export async function up(knex: Knex): Promise<void> {
  // CANCELLED_BY_USER signatures: change key "canceller_id" to "user_id"
  await knex.raw(/* sql */ `
    update petition_signature_request  
    set cancel_data = jsonb_build_object('user_id', (cancel_data->>'canceller_id')::int)
    where cancel_reason = 'CANCELLED_BY_USER' and cancel_data->>'canceller_id' is not null
  `);

  // REQUEST_RESTARTED signatures: change key "canceller_id" (refering to a contact) to "petition_access_id"
  await knex.raw(/* sql */ `
    update petition_signature_request psr
    set cancel_data = jsonb_build_object('petition_access_id', pa.id)
    from petition_access pa
    where psr.cancel_reason = 'REQUEST_RESTARTED'
      and pa.petition_id = psr.petition_id 
      and pa.contact_id = (psr.cancel_data->>'canceller_id')::int
  `);

  // where data->cancel_reason === "CANCELLED_BY_USER" change "data->cancel_data->canceller_id" to "data->cancel_data->user_id"
  await knex.raw(/* sql */ `
    update petition_event
    set "data" = jsonb_build_object(
      'cancel_data', jsonb_build_object('user_id', ("data"->'cancel_data'->>'canceller_id')::int), 
      'cancel_reason', 'CANCELLED_BY_USER',
      'petition_signature_request_id', ("data"->>'petition_signature_request_id')::int
    )
    where 
      type = 'SIGNATURE_CANCELLED' 
      and "data"->>'cancel_reason' = 'CANCELLED_BY_USER' 
      and "data"->'cancel_data'->>'canceller_id' is not null
  `);

  // where data->cancel_reason === "REQUEST_RESTARTED" change "data->cancel_data->canceller_id" (refering to a contact) to "data->cancel_data->petition_access_id"
  await knex.raw(/* sql */ `
    update petition_event pe
    set "data" = jsonb_build_object(
      'cancel_data', jsonb_build_object('petition_access_id', pa.id),
      'cancel_reason', 'REQUEST_RESTARTED',
      'petition_signature_request_id', ("data"->>'petition_signature_request_id')::int
    )
    from petition_access pa
    where pe.type = 'SIGNATURE_CANCELLED'
      and pe."data"->>'cancel_reason' = 'REQUEST_RESTARTED'
      and pe.petition_id = pa.petition_id
      and pa.contact_id = (pe."data"->'cancel_data'->>'canceller_id')::int;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update petition_signature_request  
    set cancel_data = jsonb_build_object('canceller_id', (cancel_data->>'user_id')::int)  
    where cancel_reason = 'CANCELLED_BY_USER' and cancel_data->>'user_id' is not null;
  `);

  await knex.raw(/* sql */ `
    update petition_signature_request psr
    set cancel_data = jsonb_build_object('canceller_id', pa.contact_id)
    from petition_access pa
    where psr.cancel_reason = 'REQUEST_RESTARTED' and pa.petition_id = psr.petition_id and pa.id = (psr.cancel_data->>'petition_access_id')::int;
  `);

  await knex.raw(/* sql */ `
    update petition_event
    set "data" = jsonb_build_object(
      'cancel_data', jsonb_build_object('canceller_id', ("data"->'cancel_data'->>'user_id')::int), 
      'cancel_reason', 'CANCELLED_BY_USER',
      'petition_signature_request_id', ("data"->>'petition_signature_request_id')::int
    )
    where 
      "type" = 'SIGNATURE_CANCELLED'
      and "data"->>'cancel_reason' = 'CANCELLED_BY_USER'
      and "data"->'cancel_data'->>'user_id' is not null
  `);

  await knex.raw(/* sql */ `
    update petition_event pe
    set "data" = jsonb_build_object(
      'cancel_data', jsonb_build_object('canceller_id', pa.contact_id), 
      'cancel_reason', 'REQUEST_RESTARTED',
      'petition_signature_request_id', ("data"->>'petition_signature_request_id')::int
    )
    from petition_access pa
    where pe.type = 'SIGNATURE_CANCELLED'
      and pe."data"->>'cancel_reason' = 'REQUEST_RESTARTED'
      and pe.petition_id = pa.petition_id
      and pa.id = (pe."data"->'cancel_data'->>'petition_access_id')::int;
  `);
}
