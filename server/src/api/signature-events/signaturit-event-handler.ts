import { RequestHandler, Router, urlencoded } from "express";
import { isDefined, pick } from "remeda";
import { ApiContext } from "../../context";
import { SignatureStartedEvent } from "../../db/events";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
import { SignaturitEvents } from "../../services/signature-clients/signaturit";
import { fromGlobalId } from "../../util/globalId";

export interface SignaturItEventBody {
  document: {
    created_at: string;
    decline_reason?: string; // only for document_declined event type
    file: { name: string; pages: string; size: string };
    id: string;
    events?: {
      created_at: string;
      type: SignaturitEvents;
      decline_reason?: string;
    }[];
    signature: { id: string };
    email: string;
    name: string;
    status: string;
  };
  created_at: string;
  type: SignaturitEvents;
  reason?: string;
}

const HANDLERS: Partial<
  Record<SignaturitEvents, (ctx: ApiContext, data: SignaturItEventBody, petitionId: number) => void>
> = {
  document_opened: documentOpened,
  document_signed: documentSigned,
  document_declined: documentDeclined,
  audit_trail_completed: auditTrailCompleted,
  email_delivered: emailDelivered,
  email_opened: emailOpened,
  email_bounced: emailBounced,
};

export const signaturitEventHandlers: RequestHandler = Router()
  .use(urlencoded({ extended: true }))
  .post("/:petitionId/events", async (req, res, next) => {
    try {
      const body = req.body as SignaturItEventBody;
      const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
        `SIGNATURIT/${body.document.signature.id}`
      );

      if (!isDefined(signature) || signature.status === "CANCELLED") {
        // status 200 to kill request but avoid sending an error to signaturit
        return res.sendStatus(200).end();
      }
      const handler = HANDLERS[body.type];
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
  });

/** a signer opened the signing page on the signature provider */
async function documentOpened(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [signer, signerIndex] = findSigner(signature!.signature_config.signersInfo, data.document);

  await ctx.petitions.updatePetitionSignatureByExternalId(signature.external_id!, {
    signer_status: {
      ...signature.signer_status,
      [signerIndex]: {
        ...signature.signer_status[signerIndex],
        opened_at: new Date(data.created_at),
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

/** the document was signed by any of the assigned signers */
async function documentSigned(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`
  );

  const [signer, signerIndex] = findSigner(signature!.signature_config.signersInfo, data.document);

  await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    {
      signer_status: {
        ...signature!.signer_status,
        [signerIndex]: {
          ...signature!.signer_status[signerIndex],
          signed_at: new Date(data.created_at),
        },
      },
    }
  );
  await ctx.petitions.createEvent({
    type: "RECIPIENT_SIGNED",
    petition_id: petitionId,
    data: {
      signer,
      petition_signature_request_id: signature!.id,
    },
  });
}

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [canceller, cancellerIndex] = findSigner(
    signature.signature_config.signersInfo,
    data.document
  );

  await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature, {
    cancel_reason: "DECLINED_BY_SIGNER",
    cancel_data: {
      canceller,
      decline_reason: data.document.decline_reason,
    },
    signer_status: {
      ...signature.signer_status,
      [cancellerIndex]: {
        ...signature.signer_status[cancellerIndex],
        declined_at: new Date(data.created_at),
      },
    },
  });
}

/** audit trail has been completed, audit trail and signed document are ready to be downloaded */
async function auditTrailCompleted(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const {
    id: documentId,
    signature: { id: signatureId },
  } = data.document;

  const signature = await fetchPetitionSignature(signatureId, ctx);
  const [signer] = findSigner(signature!.signature_config.signersInfo, data.document);

  await ctx.signature.storeSignedDocument(signature, `${signatureId}/${documentId}`, signer);
  await ctx.signature.storeAuditTrail(signature, `${signatureId}/${documentId}`);
}

async function emailDelivered(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [, signerIndex] = findSigner(signature.signature_config.signersInfo, data.document);
  await ctx.petitions.updatePetitionSignatureByExternalId(signature.external_id!, {
    signer_status: {
      ...signature.signer_status,
      [signerIndex]: {
        ...signature.signer_status[signerIndex],
        sent_at: new Date(data.created_at),
      },
    },
  });
  await updateSignatureStartedEvent(
    petitionId,
    { email_delivered_at: new Date(data.created_at) },
    ctx
  );
}

async function emailOpened(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  await updateSignatureStartedEvent(
    petitionId,
    { email_opened_at: new Date(data.created_at) },
    ctx
  );
}

async function emailBounced(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`
  );

  if (!signature) {
    throw new Error(
      `Can't find PetitionSignatureRequest with external_id: SIGNATURIT/${data.document.signature.id}`
    );
  }

  const [, signerIndex] = findSigner(signature.signature_config.signersInfo, data.document);
  await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature, {
    cancel_reason: "REQUEST_ERROR",
    cancel_data: {
      error: data.reason ?? `email ${data.document.email} bounced`,
      error_code: "EMAIL_BOUNCED",
      extra: pick(data.document, ["email", "name"]),
    },
    signer_status: {
      ...signature.signer_status,
      [signerIndex]: {
        ...signature.signer_status[signerIndex],
        bounced_at: new Date(data.created_at),
      },
    },
  });
  await updateSignatureStartedEvent(
    petitionId,
    { email_bounced_at: new Date(data.created_at) },
    ctx
  );
}

async function fetchPetitionSignature(signatureId: string, ctx: ApiContext) {
  const externalId = `SIGNATURIT/${signatureId}`;
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(externalId);
  if (!signature) {
    throw new Error(`Petition signature request with externalId: ${externalId} not found.`);
  }
  if (signature.status === "CANCELLED") {
    throw new Error(
      `Requested petition signature with id: ${signature.id} was previously cancelled`
    );
  }

  return signature;
}

async function appendEventLogs(ctx: ApiContext, data: SignaturItEventBody): Promise<void> {
  // data.document.events contain the complete list of events since signature was started
  // we just want to append the last event to the log
  delete data.document.events;
  await ctx.petitions.appendPetitionSignatureEventLogs(`SIGNATURIT/${data.document.signature.id}`, [
    data,
  ]);
}

function findSigner(
  signers: (PetitionSignatureConfigSigner & { externalId?: string })[],
  document: SignaturItEventBody["document"]
): [PetitionSignatureConfigSigner, number] {
  const signerIndex = signers.findIndex((signer) => signer.externalId === document.id);

  const signer = signers[signerIndex];

  if (!signer) {
    throw new Error(
      `Can't find signer on signature_config. Document: ${JSON.stringify(
        document
      )}, signersInfo: ${JSON.stringify(signers)}`
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
