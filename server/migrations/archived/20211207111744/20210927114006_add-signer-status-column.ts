import { Knex } from "knex";
import { Contact, PetitionSignatureRequest } from "../src/db/__types";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.jsonb("signer_status").notNullable().defaultTo(knex.raw("'{}'::json"));
  });

  // read every petition_signature_request in PROCESSING status and reconstruct signer_status based on event_logs
  // (signer_status is only used in frontend for PROCESSING requests)
  const signatures = await knex
    .from<PetitionSignatureRequest>("petition_signature_request")
    .where("status", "PROCESSING")
    .select("*");

  for (const signature of signatures) {
    await updateSignerStatus(signature, knex);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("petition_signature_request", (t) => {
    t.dropColumn("signer_status");
  });
}

async function updateSignerStatus(signature: PetitionSignatureRequest, knex: Knex) {
  const contactIds = signature.signature_config.contactIds as number[];
  const eventsLog = signature.event_logs as { type: string; document: { email: string } }[];

  const contacts = await knex
    .from<Contact>("contact")
    .whereIn("id", contactIds)
    .whereNull("deleted_at");

  const signerStatus: Record<number, string> = {};
  eventsLog.forEach((event) => {
    if (event.type === "document_signed" || event.type === "document_declined") {
      const contactId = contacts.find((c) => c.email === event.document.email)?.id;
      if (contactId) {
        signerStatus[contactId] = event.type === "document_signed" ? "SIGNED" : "DECLINED";
      }
    }
  });

  await knex
    .from<PetitionSignatureRequest>("petition_signature_request")
    .where("id", signature.id)
    .update("signer_status", JSON.stringify(signerStatus));
}
