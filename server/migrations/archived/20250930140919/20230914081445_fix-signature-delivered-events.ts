import { Knex } from "knex";
import { unique } from "remeda";
import { SignatureDeliveredEvent } from "../src/db/events/PetitionEvent";
import { PetitionSignatureConfigSigner } from "../src/db/repositories/PetitionRepository";
import { sqlValues } from "./helpers/knex";

export async function up(knex: Knex): Promise<void> {
  const events = await knex
    .from<SignatureDeliveredEvent>("petition_event")
    .where("type", "SIGNATURE_DELIVERED")
    .select("*");

  const signatureRequestIds = unique(events.map((e) => e.data.petition_signature_request_id));

  const signatureRequests = await knex
    .from("petition_signature_request")
    .whereIn("id", signatureRequestIds)
    .select("*");

  const data: { eventId: number; externalId: string | null }[] = events.map((event) => {
    const signature = signatureRequests.find(
      (s) => s.id === event.data.petition_signature_request_id,
    )!;

    return {
      eventId: event.id,
      externalId:
        (
          signature.signature_config.signersInfo as (PetitionSignatureConfigSigner & {
            externalId: string;
          })[]
        ).find((s) => s.email === event.data.signer.email)?.externalId ?? null,
    };
  });

  // add externalId to SIGNATURE_DELIVERED event signer, so it can be correctly matched for event updates
  // externalId can be null if signer is outdated (e.g. email changed from dashboard)
  if (data.length > 0) {
    await knex.raw(
      /* sql */ `
    with update_data as (
        select * from (?) as t(eventId, externalId)
    )
    update petition_event pe
    set data = "data" || jsonb_build_object(
	    'signer', "data"->'signer' || jsonb_build_object('externalId', ud.externalId)
    )
    from update_data ud
    where ud.eventId = pe.id;
  `,
      [
        knex.raw(
          ...sqlValues(
            data.map((d) => [d.eventId, d.externalId]),
            ["int", "text"],
          ),
        ),
      ],
    );
  }
}

export async function down(knex: Knex): Promise<void> {}
