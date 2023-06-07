import { json, RequestHandler, Router } from "express";
import { isDefined, maxBy } from "remeda";
import { ApiContext } from "../../context";
import { SignatureStartedEvent } from "../../db/events/PetitionEvent";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
import { fullName } from "../../util/fullName";
import { fromGlobalId } from "../../util/globalId";

type EnvelopeEvent =
  | // This event is sent when the email notification, with a link to the envelope,
  // is sent to at least one recipient or when it is a recipient's turn to sign during embedded signing.
  // The envelope remains in this state until all recipients have viewed the envelope.
  "envelope-sent"
  // This event is sent when all recipients have opened the envelope through the DocuSign signing website.
  // This does not signify an email delivery of an envelope.
  | "envelope-delivered"
  // The envelope has been completed by all the recipients.
  | "envelope-completed"
  // The envelope has been declined by one of the recipients.
  | "envelope-declined"
  // The envelope has been voided by the sender or has expired. The void reason indicates whether the envelope was manually voided or expired.
  | "envelope-voided"
  // Sent when the envelope is resent within the web application or via the Envelopes API call. Only available in JSON SIM message format.
  | "envelope-resent"
  // Sent when the envelope is corrected within the web application or via any of the Envelopes/EnvelopesRecipients API calls. Only available in JSON SIM message format.
  // Note: This event can only be generated in the API after an envelope lock is created prior to the envelope update, and then subsequently removed.
  | "envelope-corrected"
  // Sent when the envelope is queued to be purged within the web application or via the Update Envelopes API call. Only available in JSON SIM message format.
  // Note: The Purge queue has four states that will populate within the purgeState parameter within the envelope summary.
  // - documents_queued
  // - documents_and_metadata_queued
  // - documents_and_metadata_and_redact_queued
  // - documents_dequeued
  | "envelope-purge"
  // This event is sent after an already-sent envelope is deleted within the web application. Only available in JSON SIM message format.
  // Note: This event will not trigger for Envelopes in created or draft state.
  | "envelope-deleted"
  // Sent when an envelope in a created or draft state is deleted within the web application or discarded within the tagging UI.
  // Only available in JSON SIM message format.
  | "envelope-discard";

type RecipientEvent =
  // This event is sent when an email notification is sent to the recipient signifying that it is their turn to sign an envelope.
  | "recipient-sent"
  // Sent when DocuSign gets notification that an email delivery has failed. The delivery failure could be for a number of reasons,
  // such as a bad email address or that the recipient’s email system auto-responds to the email from DocuSign.
  | "recipient-autoresponded"
  // Sent when the recipient has viewed the document(s) in an envelope through the DocuSign signing web site.
  // This does not signify an email delivery of an envelope.
  | "recipient-delivered"
  // Sent when the recipient has completed their actions for the envelope, typically (but not always) by signing.
  | "recipient-completed"
  // Sent when the recipient declines to sign the document(s) in the envelope.
  | "recipient-declined"
  // Sent when the recipient fails an authentication check. In cases where a recipient has multiple attempts to pass a check,
  // it means that the recipient failed all the attempts.
  | "recipient-authenticationfailed"
  // Sent when the recipient selects finish within the web application on an Envelope. Only available in JSON SIM message format.
  | "recipient-resent"
  // Sent after a Delegation rule is in place and when a delegated signer is sent an envelope within the web application or the API.
  // Only available in JSON SIM message format.
  | "recipient-delegate"
  // Sent when the envelope is reassigned by a recipient within the web application. Only available in JSON SIM message format.
  | "recipient-reassign"
  // Sent when the recipient selects finish within the web application on an Envelope. Only available in JSON SIM message format.
  | "recipient-finish-later";

export type DocuSignEventBody = {
  event: EnvelopeEvent | RecipientEvent;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: number;
  generatedDateTime: string;
  data: {
    accountId: string;
    userId: string;
    envelopeId: string;
    recipientId?: string;
    reassignedRecipientId?: string;
    envelopeSummary: {
      status: string;
      voidedReason?: string;
      recipients: {
        signers: {
          name: string;
          email: string;
          recipientId: string;
          status: string;
          declinedReason?: string;
        }[];
      };
    };
  };
};

const HANDLERS: Partial<
  Record<
    EnvelopeEvent | RecipientEvent,
    (ctx: ApiContext, data: DocuSignEventBody, petitionId: number) => void
  >
> = {
  "recipient-sent": recipientSent,
  "recipient-delivered": recipientDelivered,
  "recipient-declined": recipientDeclined,
  "envelope-voided": envelopeVoided,
  "recipient-completed": recipientCompleted,
  "envelope-completed": envelopeCompleted,
  "recipient-autoresponded": recipientAutoresponded,
  "recipient-reassign": recipientReassigned,
};

/*
const validateHMACSignature: RequestHandler = (req, res, next) => {
  // check against multiple keys to allow for key rotation on Docusign panel
  const headerKeys = ["x-docusign-signature-1", "x-docusign-signature-2"];
  const isValid = headerKeys.some((key) => {
    const signature = req.headers[key] as string | undefined;
    if (signature) {
      const hash = createHmac(
        "sha256",
        req.context.config.oauth.docusign.production.webhookHmacSecret
      )
        .update(JSON.stringify(req.body))
        .digest("base64");
      if (timingSafeEqual(Buffer.from(hash, "base64"), Buffer.from(signature, "base64"))) {
        return true;
      }
    }
    return false;
  });

  if (isValid) {
    next();
  } else {
    res.sendStatus(401).end();
  }
};
*/

export const docusignEventHandlers: RequestHandler = Router()
  .use(json())
  .post(
    "/:petitionId/events",
    /*validateHMACSignature,*/ async (req, res, next) => {
      try {
        const body = req.body as DocuSignEventBody;
        const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
          `DOCUSIGN/${body.data.envelopeId}`
        );

        if (!isDefined(signature) || signature.status === "CANCELLED") {
          // status 200 to kill request but avoid sending an error to signaturit
          return res.sendStatus(200).end();
        }
        const handler = HANDLERS[body.event];
        const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
        (async function () {
          try {
            await appendEventLogs(req.context, body);
            await handler?.(req.context, body, petitionId);
          } catch (error: any) {
            req.context.logger.error(error.message, { stack: error.stack });
          }
        })();
        res.sendStatus(200).end();
      } catch (error: any) {
        req.context.logger.error(error.message, { stack: error.stack });
        next(error);
      }
    }
  );

/** email is sent to the recipient signifying that it is their turn to sign an envelope. */
async function recipientSent(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;

  /* 
    recipient externalId may not be found on the signature config if this recipient
    was assigned by somebody else. In this case we will skip without throwing error
  */
  let signerIndex: number;
  try {
    [, signerIndex] = findSigner(signature.signature_config.signersInfo, body.data.recipientId!);
  } catch {
    return;
  }

  await ctx.petitions.updatePetitionSignatureByExternalId(signature.external_id!, {
    signer_status: {
      ...signature.signer_status,
      [signerIndex]: {
        ...signature.signer_status[signerIndex],
        sent_at: new Date(body.generatedDateTime),
      },
    },
  });

  await updateSignatureStartedEvent(
    petitionId,
    {
      email_delivered_at: new Date(body.generatedDateTime),
    },
    ctx
  );
}

/** a signer opened the signing page on the signature provider */
async function recipientDelivered(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;
  const [signer, signerIndex] = findSigner(
    signature!.signature_config.signersInfo,
    body.data.recipientId!
  );

  await ctx.petitions.updatePetitionSignatureByExternalId(signature.external_id!, {
    signer_status: {
      ...signature.signer_status,
      [signerIndex]: {
        ...signature.signer_status[signerIndex],
        opened_at: new Date(body.generatedDateTime),
      },
    },
  });

  await ctx.petitions.createEvent({
    type: "SIGNATURE_OPENED",
    petition_id: petitionId,
    data: {
      signer,
      petition_signature_request_id: signature!.id,
    },
  });
}

/** signer declined the document. Whole signature process will be cancelled */
async function recipientDeclined(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;
  const [canceller, cancellerIndex] = findSigner(
    signature.signature_config.signersInfo,
    body.data.recipientId!
  );

  const declineReason = body.data.envelopeSummary.recipients.signers.find(
    (s) => s.recipientId === body.data.recipientId!
  )?.declinedReason;

  await ctx.signature.cancelSignatureRequest(
    signature,
    "DECLINED_BY_SIGNER",
    {
      canceller,
      decline_reason: declineReason,
    },
    {
      signer_status: {
        ...signature.signer_status,
        [cancellerIndex]: {
          ...signature.signer_status[cancellerIndex],
          declined_at: new Date(body.generatedDateTime),
        },
      },
    }
  );
}

/**
 * envelope has been voided (declined) by some signer
 * similar to recipient-declined, but when document has only 1 signer.
 * in this event, body.data.recipientId is undefined so we assume the decliner is the only signer.
 * this event is also sent by docusign when user cancels/restarts the signature request,
 * but in that case the event will not be processed because the signature will be already cancelled.
 *
 * voided envelopes are already canceled by docusign so there is no need to call signature service
 * */
async function envelopeVoided(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;
  const [canceller, cancellerIndex] = [signature.signature_config.signersInfo[0], 0];
  await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
    cancel_reason: "DECLINED_BY_SIGNER",
    cancel_data: {
      canceller,
      decline_reason: body.data.envelopeSummary.voidedReason,
    },
    signer_status: {
      ...signature.signer_status,
      [cancellerIndex]: {
        ...signature.signer_status[cancellerIndex],
        declined_at: new Date(body.generatedDateTime),
      },
    },
  });
}

/** recipient signed the document */
async function recipientCompleted(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;

  let signerIndex: number;
  let signer: PetitionSignatureConfigSigner;
  try {
    [signer, signerIndex] = findSigner(
      signature.signature_config.signersInfo,
      body.data.recipientId!
    );
  } catch {
    return;
  }

  await ctx.petitions.updatePetitionSignatureByExternalId(`DOCUSIGN/${body.data.envelopeId}`, {
    signer_status: {
      ...signature!.signer_status,
      [signerIndex]: {
        ...signature!.signer_status[signerIndex],
        signed_at: new Date(body.generatedDateTime),
      },
    },
  });

  await ctx.petitions.createEvent({
    type: "RECIPIENT_SIGNED",
    petition_id: petitionId,
    data: {
      signer,
      petition_signature_request_id: signature!.id,
    },
  });
}

/** document is completed (everyone has already signed). document and audit trail are ready to be downloaded */
async function envelopeCompleted(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;

  // fetch signer with most recent signed_at Date to show it on the Signature Completed email
  const lastSignerIndex = parseInt(
    maxBy(Object.entries(signature.signer_status as Record<string, { signed_at: string }>), (i) =>
      new Date(i[1]!.signed_at).getTime()
    )![0]
  );
  const signer = signature.signature_config.signersInfo[lastSignerIndex];

  await ctx.signature.storeSignedDocument(signature, body.data.envelopeId, signer);
  await ctx.signature.storeAuditTrail(signature, body.data.envelopeId);
}

/** Sent when DocuSign gets notification that an email delivery has failed. */
async function recipientAutoresponded(
  ctx: ApiContext,
  body: DocuSignEventBody,
  petitionId: number
) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;

  const bouncedSignerExternalId = body.data.recipientId!;
  const bouncedSignerIndex = signature.signature_config.signersInfo.findIndex(
    (s) => s.externalId === bouncedSignerExternalId
  );
  const bouncedSigner = signature.signature_config.signersInfo[bouncedSignerIndex];

  await ctx.signature.cancelSignatureRequest(
    signature,
    "REQUEST_ERROR",
    {
      error: bouncedSigner ? `email ${bouncedSigner.email} bounced` : "email bounced",
      error_code: "EMAIL_BOUNCED",
      extra: bouncedSigner
        ? {
            email: bouncedSigner.email,
            name: fullName(bouncedSigner.firstName, bouncedSigner.lastName),
          }
        : null,
    },
    {
      signer_status: {
        ...signature.signer_status,
        [bouncedSignerIndex]: {
          ...signature.signer_status[bouncedSignerIndex],
          bounced_at: new Date(body.generatedDateTime),
        },
      },
    }
  );

  await updateSignatureStartedEvent(
    petitionId,
    { email_bounced_at: new Date(body.generatedDateTime) },
    ctx
  );
}

/** one of the recipients reassigned their signature to another person. We need to update the recipientIds to point to the new signer */
async function recipientReassigned(ctx: ApiContext, body: DocuSignEventBody, petitionId: number) {
  const signature = (await ctx.petitions.loadPetitionSignatureByExternalId(
    `DOCUSIGN/${body.data.envelopeId}`
  ))!;

  await ctx.petitions.updatePetitionSignatureByExternalId(`DOCUSIGN/${body.data.envelopeId}`, {
    signature_config: {
      ...signature.signature_config,
      signersInfo: signature.signature_config.signersInfo.map((s) => ({
        ...s,
        externalId:
          s.externalId === body.data.recipientId ? body.data.reassignedRecipientId : s.externalId,
      })),
    },
  });
}

async function appendEventLogs(ctx: ApiContext, body: DocuSignEventBody): Promise<void> {
  await ctx.petitions.appendPetitionSignatureEventLogs(`DOCUSIGN/${body.data.envelopeId}`, [body]);
}

function findSigner(
  signers: (PetitionSignatureConfigSigner & { externalId?: string })[],
  recipientExternalId: string
): [PetitionSignatureConfigSigner, number] {
  const signerIndex = signers.findIndex((signer) => signer.externalId === recipientExternalId);

  const signer = signers[signerIndex];

  if (!signer) {
    throw new Error(
      `Can't find signer on signature_config. externalId: ${recipientExternalId}, signersInfo: ${JSON.stringify(
        signers
      )}`
    );
  }

  return [signer, signerIndex];
}

async function updateSignatureStartedEvent(
  petitionId: number,
  newData: Omit<SignatureStartedEvent["data"], "petition_signature_request_id">,
  ctx: ApiContext
) {
  const [signatureStartedEvent] = await ctx.petitions.getPetitionEventsByType(petitionId, [
    "SIGNATURE_STARTED",
  ]);

  if (isDefined(newData.email_opened_at) && isDefined(signatureStartedEvent.data.email_opened_at)) {
    // write the email_opened_at Date only once, so future email opens after signature is completed don't overwrite this date
    return;
  }

  await ctx.petitions.updateEvent(signatureStartedEvent.id, {
    ...signatureStartedEvent,
    data: {
      ...signatureStartedEvent.data,
      ...newData,
    },
  });
}
