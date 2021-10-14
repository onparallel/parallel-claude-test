import { Knex } from "knex";
import pMap from "p-map";
import { isDefined, omit } from "remeda";
import { RecipientSignedEvent, SignatureCancelledEvent } from "../src/db/events";
import { Contact, Petition, PetitionSignatureRequest } from "../src/db/__types";
import { unMaybeArray } from "../src/util/arrays";
import { MaybeArray } from "../src/util/types";

/*
 * we are going to change how we store signers information on tables petition and petition_signature_request
 * from:
 *  signature_config: {
 *      contactIds: number[];
 *      additionalSignerContactIds?: number[];
 *      ...
 *  }
 * to:
 *  signature_config: {
 *      signersInfo: Array<{
 *          contactId?: number; // just to have a reference of the original contact, will not be used to fetch info
 *          firstName: Maybe<string>;
 *          lastName: Maybe<string>;
 *          email: string
 *      }>;
 *      additionalSignersInfo: Array<{
 *          contactId?: number; // this will only be present on past configurations. new additionalSignersInfo will have undefined contactId
 *          firstName: Maybe<string>;
 *          lastName: Maybe<string>;
 *          email: string
 *      }>;
 *      ...
 *  }
 *
 * this will allow us to have more flexibility when selecting signers, as contact_id only works for the organization that created the contact.
 * We will also be able to configure more than one signer with the same email.
 */

/** for the migrate function, we will try to keep old data whenever its possible so we can safely run the migration before starting the release */
export async function up(knex: Knex): Promise<void> {
  // update every petition.signature_config to new signers structure
  await PetitionsMigration.up(knex);

  // on petition_signature_request we need to update:
  // - signature_config
  // - cancel_data when cancel_reason is DECLINED_BY_SIGNER
  // - signer_status. Record will be indexed by the index of the signer on signature_config.signersInfo array
  await PetitionSignatureRequestsMigration.up(knex);

  // update SIGNATURE_CANCELLED and RECIPIENT_SIGNED event data to include signer info
  await PetitionEventsMigration.up(knex);
}

// for the down function, we can only rollback data if the contact_id is defined. otherwise we will discard it to avoid errors
export async function down(knex: Knex): Promise<void> {
  await PetitionEventsMigration.down(knex);
  await PetitionSignatureRequestsMigration.down(knex);
  await PetitionsMigration.down(knex);
}

const PetitionSignatureRequestsMigration = {
  up: async (knex: Knex) => {
    const signatureRequests = await knex
      .from<PetitionSignatureRequest>("petition_signature_request")
      .select("*");

    await pMap(
      signatureRequests,
      async (signatureRequest) => {
        const contactIds = signatureRequest.signature_config.contactIds as number[];
        const contacts = await loadContact(contactIds, knex);

        const newSignatureConfig = {
          ...signatureRequest.signature_config, // don't delete contactIds, so we can execute this migration without breaking the production code pre-release.
          signersInfo: contacts.map(mapContact),
        };

        let newCancelData = signatureRequest.cancel_data;

        if (
          signatureRequest.cancel_reason === "DECLINED_BY_SIGNER" &&
          // keys changed from contact_id to canceller_id, look in both to be sure we get it
          (newCancelData.canceller_id !== undefined || newCancelData.contact_id !== undefined)
        ) {
          const [signer] = await loadContact(
            (signatureRequest.cancel_data.canceller_id as number) ??
              (signatureRequest.cancel_data.contact_id as number),
            knex
          );
          newCancelData = {
            ...newCancelData,
            canceller: mapContact(signer),
          };
        }

        const signerIds = Object.keys(signatureRequest.signer_status);
        const newSignerStatus: Record<string, string> = {};
        signerIds.forEach((signerId) => {
          const signerIndex = contactIds.findIndex((contactId) => contactId === parseInt(signerId));
          newSignerStatus[signerIndex] = signatureRequest.signer_status[signerId];
        });

        await knex
          .from<PetitionSignatureRequest>("petition_signature_request")
          .where("id", signatureRequest.id)
          .update({
            signature_config: JSON.stringify(newSignatureConfig),
            cancel_data: newCancelData ? JSON.stringify(newCancelData) : null,
            signer_status: JSON.stringify(newSignerStatus),
          });
      },
      { concurrency: 10 }
    );
  },
  down: async (knex: Knex) => {
    const signatureRequests = await knex
      .from<PetitionSignatureRequest>("petition_signature_request")
      .select("*");

    await pMap(
      signatureRequests,
      async (signatureRequest) => {
        // signers that were specified by recipients don't come with a contactId, so those will be discarded
        const contactIds = (signatureRequest.signature_config.signersInfo as MappedContact[])
          .map((signer) => signer.contactId)
          .filter(isDefined);

        const newSignerStatus: Record<string, string> = {};
        Object.keys(signatureRequest.signer_status).forEach((signerIndex) => {
          newSignerStatus[contactIds[parseInt(signerIndex)]] =
            signatureRequest.signer_status[signerIndex];
        });

        await knex
          .from<PetitionSignatureRequest>("petition_signature_request")
          .where("id", signatureRequest.id)
          .update({
            signature_config: JSON.stringify({
              ...omit(signatureRequest.signature_config, ["signersInfo"]),
              contactIds,
            }),
            cancel_data: signatureRequest.cancel_data
              ? JSON.stringify({
                  ...omit(signatureRequest.cancel_data, ["canceller"]),
                  contact_id: signatureRequest.cancel_data.canceller?.contactId,
                })
              : null,
            signer_status: JSON.stringify(newSignerStatus),
          });
      },
      { concurrency: 10 }
    );
  },
};

const PetitionsMigration = {
  up: async (knex: Knex) => {
    const petitionsWithSignature = await knex
      .from<Petition>("petition")
      .whereNotNull("signature_config");

    await pMap(
      petitionsWithSignature,
      async (petition) => {
        const contactIds = petition.signature_config.contactIds as number[];
        const additionalSignerIds = (petition.signature_config.additionalSignerContactIds ??
          []) as number[];

        const contacts = await loadContact(contactIds, knex);
        const additionalContacts = await loadContact(additionalSignerIds, knex);

        await knex
          .from<Petition>("petition")
          .where("id", petition.id)
          .update(
            "signature_config",
            JSON.stringify({
              ...petition.signature_config,
              signersInfo: contacts.map(mapContact),
              additionalSignersInfo: additionalContacts.map(mapContact),
            })
          );
      },
      { concurrency: 10 }
    );
  },
  down: async (knex: Knex) => {
    const petitionsWithSignature = await knex
      .from<Petition>("petition")
      .whereNotNull("signature_config");

    await pMap(
      petitionsWithSignature,
      async (petition) => {
        await knex
          .from<Petition>("petition")
          .where("id", petition.id)
          .update(
            "signature_config",
            JSON.stringify({
              ...omit(petition.signature_config, ["signersInfo", "additionalSignersInfo"]),
              contactIds: ((petition.signature_config.signersInfo ?? []) as MappedContact[])
                .map((signer) => signer.contactId)
                .filter(isDefined),
              additionalSignerContactIds: (
                (petition.signature_config.additionalSignersInfo ?? []) as MappedContact[]
              )
                .map((signer) => signer.contactId)
                .filter(isDefined),
            })
          );
      },
      { concurrency: 10 }
    );
  },
};

const PetitionEventsMigration = {
  up: async (knex: Knex) => {
    const events: (SignatureCancelledEvent | RecipientSignedEvent)[] = await knex
      .from("petition_event")
      .whereIn("type", ["SIGNATURE_CANCELLED", "RECIPIENT_SIGNED"]);

    await pMap(
      events,
      async (event) => {
        if (event.type === "RECIPIENT_SIGNED" && (event.data as any).contact_id) {
          const [contact] = await loadContact((event.data as any).contact_id, knex);
          await knex
            .from("petition_event")
            .where("id", event.id)
            .update(
              "data",
              JSON.stringify({
                ...event.data,
                signer: mapContact(contact),
              })
            );
        } else if (
          event.type === "SIGNATURE_CANCELLED" &&
          event.data.cancel_reason === "DECLINED_BY_SIGNER" &&
          event.data.cancel_data?.canceller_id !== undefined
        ) {
          const [signer] = await loadContact(event.data.cancel_data?.canceller_id as number, knex);
          await knex
            .from("petition_event")
            .where("id", event.id)
            .update(
              "data",
              JSON.stringify({
                ...event.data,
                cancel_data: {
                  ...event.data.cancel_data,
                  canceller: mapContact(signer),
                },
              })
            );
        }
      },
      { concurrency: 10 }
    );
  },
  down: async (knex: Knex) => {
    const events: (SignatureCancelledEvent | RecipientSignedEvent)[] = await knex
      .from("petition_event")
      .whereIn("type", ["SIGNATURE_CANCELLED", "RECIPIENT_SIGNED"]);

    await pMap(
      events,
      async (event) => {
        if (event.type === "RECIPIENT_SIGNED") {
          if (isDefined((event.data as any).contact_id)) {
            await knex
              .from("petition_event")
              .where("id", event.id)
              .update(
                "data",
                JSON.stringify({
                  ...omit(event.data, ["signer"]),
                  contact_id: (event.data as any).contact_id,
                })
              );
          } else {
            // if event.data.contact_id is not defined on the event, we need to delete it because there is no way to obtain it
            await knex.from("petition_event").where("id", event.id).delete();
          }
        } else if (
          event.type === "SIGNATURE_CANCELLED" &&
          event.data.cancel_reason === "DECLINED_BY_SIGNER"
        ) {
          if (isDefined(event.data.cancel_data.canceller_id)) {
            await knex
              .from("petition_event")
              .where("id", event.id)
              .update(
                "data",
                JSON.stringify({
                  ...event.data,
                  cancel_data: {
                    ...omit(event.data.cancel_data, ["canceller"]),
                    canceller_id: event.data.cancel_data.canceller_id,
                  },
                })
              );
          } else {
            await knex.from("petition_event").where("id", event.id).delete();
          }
        }
      },
      { concurrency: 10 }
    );
  },
};

async function loadContact(ids: MaybeArray<number>, knex: Knex) {
  return await knex.from<Contact>("contact").whereIn("id", unMaybeArray(ids));
}

type MappedContact = ReturnType<typeof mapContact>;

function mapContact(c: Contact) {
  return {
    contactId: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
  };
}
