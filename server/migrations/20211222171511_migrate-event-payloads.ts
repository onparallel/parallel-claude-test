import { Knex } from "knex";
import pMap from "p-map";
import { isDefined } from "remeda";
import { SignatureCancelledEvent } from "../src/db/events";
import { PetitionAccess, PetitionSignatureRequest } from "../src/db/__types";

async function fetchContactId(petitionAccessId: number, knex: Knex) {
  const [access] = await knex
    .from<PetitionAccess>("petition_access")
    .where("id", petitionAccessId)
    .select("*");

  return access.contact_id;
}

async function fetchPetitionAccessId(petitionId: number, contactId: number, knex: Knex) {
  const [access] = await knex
    .from<PetitionAccess>("petition_access")
    .where({ petition_id: petitionId, contact_id: contactId })
    .select("*");

  if (!access) {
    throw new Error(`No PetitionAccess found for Petition:${petitionId} and Contact:${contactId}`);
  }
  return access.id;
}

//change some payloads on petition_signature_request and petition_event
export async function up(knex: Knex): Promise<void> {
  const signatures = await knex
    .from<PetitionSignatureRequest>("petition_signature_request")
    .whereIn("cancel_reason", ["CANCELLED_BY_USER", "REQUEST_RESTARTED"]);

  const [cancelled, restarted] = [
    signatures.filter(
      (s) =>
        s.cancel_reason === "CANCELLED_BY_USER" &&
        // some rows already have a user_id instead of canceller_id, se we will ignore those
        isDefined(s.cancel_data.canceller_id)
    ),
    signatures.filter((s) => s.cancel_reason === "REQUEST_RESTARTED"),
  ];

  // CANCELLED_BY_USER signatures: change key "canceller_id" to "user_id"
  if (cancelled.length > 0) {
    await knex.raw(
      /* sql */ `
    update petition_signature_request  
    set cancel_data = jsonb_build_object('user_id', (cancel_data->>'canceller_id')::integer)  
    where id in (${cancelled.map(() => "?").join(", ")});`,
      cancelled.map((c) => c.id)
    );
  }

  // REQUEST_RESTARTED signatures: change key "canceller_id" (refering to a contact) to "petition_access_id"
  await pMap(
    restarted,
    async (signature) => {
      const accessId = await fetchPetitionAccessId(
        signature.petition_id,
        signature.cancel_data.canceller_id as number,
        knex
      );
      await knex.raw(
        /* sql */ `
      update petition_signature_request
      set cancel_data = jsonb_build_object('petition_access_id', ?::integer)
      where id = ?;
    `,
        [accessId, signature.id]
      );
    },
    { concurrency: 10 }
  );

  // similar for petition events.
  // where data->cancel_reason === "CANCELLED_BY_USER" change "data->cancel_data->canceller_id" to "data->cancel_data->user_id"
  // where data->cancel_reason === "REQUEST_RESTARTED" change "data->cancel_data->canceller_id" (refering to a contact) to "data->cancel_data->petition_access_id"
  const signatureCancelledEvents = await knex<SignatureCancelledEvent>("petition_event").where(
    "type",
    "SIGNATURE_CANCELLED"
  );

  const [cancelledByUserEvents, requestRestartedEvents] = [
    signatureCancelledEvents.filter((e) => e.data.cancel_reason === "CANCELLED_BY_USER"),
    signatureCancelledEvents.filter((e) => e.data.cancel_reason === "REQUEST_RESTARTED"),
  ];

  if (cancelledByUserEvents.length > 0) {
    await knex.raw(
      /* sql */ `
    update petition_event
     set "data" = jsonb_build_object(
      'cancel_data', jsonb_build_object('user_id', ("data"->>cancel_data->>'canceller_id')::integer), 
      'cancel_reason', 'CANCELLED_BY_USER',
      'petition_signature_request_id', ("data"->>'petition_signature_request_id')::integer
    )
    where id in (${cancelledByUserEvents.map(() => "?").join(", ")})
  `,
      cancelledByUserEvents.map((e) => e.id)
    );
  }

  await pMap(
    requestRestartedEvents,
    async (event) => {
      const accessId = await fetchPetitionAccessId(
        event.petition_id,
        event.data.cancel_data.canceller_id,
        knex
      );

      await knex.raw(
        /* sql */ `
      update petition_event
       set "data" = jsonb_build_object(
        'cancel_data', jsonb_build_object('petition_access_id', ?::integer), 
        'cancel_reason', 'REQUEST_RESTARTED',
        'petition_signature_request_id', ("data"->>'petition_signature_request_id')::integer
      )
      where id = ?;
    `,
        [accessId, event.id]
      );
    },
    { concurrency: 10 }
  );
}

export async function down(knex: Knex): Promise<void> {
  const signatures = await knex
    .from<PetitionSignatureRequest>("petition_signature_request")
    .whereIn("cancel_reason", ["CANCELLED_BY_USER", "REQUEST_RESTARTED"]);

  const [cancelled, restarted] = [
    signatures.filter(
      (s) => s.cancel_reason === "CANCELLED_BY_USER" && isDefined(s.cancel_data.user_id)
    ),
    signatures.filter((s) => s.cancel_reason === "REQUEST_RESTARTED"),
  ];

  if (cancelled.length > 0) {
    await knex.raw(
      /* sql */ `
  update petition_signature_request  
  set cancel_data = jsonb_build_object('canceller_id', (cancel_data->>'user_id')::integer)  
  where id in (${cancelled.map(() => "?").join(", ")});`,
      cancelled.map((c) => c.id)
    );
  }

  await pMap(restarted, async (signature) => {
    const contactId = await fetchContactId(
      signature.cancel_data.petition_access_id as number,
      knex
    );
    await knex.raw(
      /* sql */ `
    update petition_signature_request
    set cancel_data = jsonb_build_object('canceller_id', ?::integer)
    where id = ?;
  `,
      [contactId, signature.id]
    );
  });

  const signatureCancelledEvents = await knex<SignatureCancelledEvent>("petition_event").where(
    "type",
    "SIGNATURE_CANCELLED"
  );

  const [cancelledByUserEvents, requestRestartedEvents] = [
    signatureCancelledEvents.filter((e) => e.data.cancel_reason === "CANCELLED_BY_USER"),
    signatureCancelledEvents.filter((e) => e.data.cancel_reason === "REQUEST_RESTARTED"),
  ];

  if (cancelledByUserEvents.length > 0) {
    await knex.raw(
      /* sql */ `
  update petition_event
  set "data" = jsonb_build_object(
    'cancel_data', jsonb_build_object('canceller_id', ("data"->>cancel_data->>'user_id')::integer), 
    'cancel_reason', 'CANCELLED_BY_USER',
    'petition_signature_request_id', ("data"->>'petition_signature_request_id')::integer
  )
  where id in (${cancelledByUserEvents.map(() => "?").join(", ")})
`,
      cancelledByUserEvents.map((e) => e.id)
    );
  }

  await pMap(
    requestRestartedEvents,
    async (event) => {
      const contactId = await fetchContactId(event.data.cancel_data.petition_access_id, knex);
      await knex.raw(
        /* sql */ `
      update petition_event
      set "data" = jsonb_build_object(
        'cancel_data', jsonb_build_object('canceller_id', ?::integer), 
        'cancel_reason', 'REQUEST_RESTARTED',
        'petition_signature_request_id', ("data"->>'petition_signature_request_id')::integer
      )
      where id = ?;
    `,
        [contactId, event.id]
      );
    },
    { concurrency: 10 }
  );
}
