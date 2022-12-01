import { Knex } from "knex";
import pMap from "p-map";
import { PetitionSignatureRequest } from "../src/db/__types";

/**
 *
 * update petition_signature_request.signer_status values
 * keys will remain the same, values will change as follows:
 *  SIGNED => { sent_at: <Date>, opened_at: <Date>, signed_at: <Date> }
 *  DECLINED => { sent_at: <Date>, opened_at: <Date>, declined_at: <Date> }
 *
 * to complete the Date, we need to look for the corresponding event in the event_logs column
 *
 * for empty objects or missing information about a particular signer (the signer didn't sign/decline yet), search and try to add sent_at and opened_at dates
 */

type SignatureRequestRow = {
  id: number;
  signers: { email: string }[];
  event_logs: { type: string; created_at: string; document?: { email: string } }[];
};

export async function up(knex: Knex): Promise<void> {
  const { rows } = await knex.raw<{ rows: SignatureRequestRow[] }>(
    /* sql */ `SELECT id, (signature_config->>'signersInfo')::jsonb as signers, event_logs from petition_signature_request`
  );

  await pMap(
    rows,
    async (row) => {
      const newSignerStatus: any = {};

      for (const event of row.event_logs) {
        if (!event.document?.email) {
          continue;
        }
        const signerIndex = row.signers.findIndex((s) => s.email === event.document!.email);
        if (event.type === "email_delivered") {
          newSignerStatus[signerIndex] = {
            ...(newSignerStatus[signerIndex] ?? {}),
            sent_at: new Date(event.created_at),
          };
        }
        if (event.type === "document_opened") {
          newSignerStatus[signerIndex] = {
            ...(newSignerStatus[signerIndex] ?? {}),
            opened_at: new Date(event.created_at),
          };
        }
        if (event.type === "document_signed") {
          newSignerStatus[signerIndex] = {
            ...(newSignerStatus[signerIndex] ?? {}),
            signed_at: new Date(event.created_at),
          };
        }
        if (event.type === "document_declined") {
          newSignerStatus[signerIndex] = {
            ...(newSignerStatus[signerIndex] ?? {}),
            declined_at: new Date(event.created_at),
          };
        }
      }

      await knex
        .from<PetitionSignatureRequest>("petition_signature_request")
        .where("id", row.id)
        .update("signer_status", newSignerStatus);
    },
    { concurrency: 10 }
  );
}

export async function down(knex: Knex): Promise<void> {
  const { rows } = await knex.raw<{ rows: { id: number; signer_status: any }[] }>(
    /* sql */ `SELECT id, signer_status from petition_signature_request`
  );

  await pMap(
    rows,
    async (row) => {
      const newStatus: any = {};
      Object.entries(row.signer_status).forEach(([signerIndex, status]: [string, any]) => {
        if (status.signed_at !== undefined) {
          newStatus[signerIndex] = "SIGNED";
        }
        if (status.declined_at !== undefined) {
          newStatus[signerIndex] = "DECLINED";
        }
      });

      await knex
        .from<PetitionSignatureRequest>("petition_signature_request")
        .where("id", row.id)
        .update("signer_status", newStatus);
    },
    { concurrency: 10 }
  );
}
