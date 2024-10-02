import { RequestHandler, Router, urlencoded } from "express";
import { isNonNullish, isNullish, pick } from "remeda";
import { ApiContext } from "../../context";
import { SignatureDeliveredEvent } from "../../db/events/PetitionEvent";
import {
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
} from "../../db/repositories/PetitionRepository";
import { SignaturitEvents } from "../../integrations/signature/SignaturitClient";
import { fromGlobalId } from "../../util/globalId";
import { Replace } from "../../util/types";

export interface SignaturitEventBody {
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
  Record<SignaturitEvents, (ctx: ApiContext, data: SignaturitEventBody, petitionId: number) => void>
> = {
  document_opened: documentOpened,
  document_signed: documentSigned,
  document_declined: documentDeclined,
  audit_trail_completed: auditTrailCompleted,
  email_delivered: emailDelivered,
  email_opened: emailOpened,
  email_bounced: emailBounced,
  document_expired: documentExpired,
};

export const signaturitEventHandlers: RequestHandler = Router()
  .use(urlencoded({ extended: true }))
  .post("/:petitionId/events", async (req, res, next) => {
    try {
      const body = req.body as SignaturitEventBody;
      const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
        `SIGNATURIT/${body.document.signature.id}`,
      );

      if (isNullish(signature) || signature.status === "CANCELLED") {
        // status 200 to kill request but avoid sending an error to signaturit
        return res.sendStatus(200).end();
      }
      const handler = HANDLERS[body.type];
      const petitionId = fromGlobalId(req.params.petitionId, "Petition").id;
      (async function () {
        try {
          await appendEventLogs(req.context, body);
          handler?.(req.context, body, petitionId);
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
async function documentOpened(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [signer, signerIndex] = await findSigner(signature!.signature_config, data.document, ctx);

  await ctx.petitions.updatePetitionSignatureSignerStatusByExternalId(
    signature.external_id!,
    signerIndex,
    { opened_at: new Date(data.created_at) },
  );
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
async function documentSigned(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [signer, signerIndex] = await findSigner(signature.signature_config, data.document, ctx);

  await ctx.petitions.updatePetitionSignatureSignerStatusByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    signerIndex,
    { signed_at: new Date(data.created_at) },
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
async function documentDeclined(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [canceller, cancellerIndex] = await findSigner(
    signature.signature_config,
    data.document,
    ctx,
  );

  await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
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
async function auditTrailCompleted(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const {
    id: documentId,
    signature: { id: signatureId },
  } = data.document;

  const signature = await fetchPetitionSignature(signatureId, ctx);
  const [signer] = await findSigner(signature!.signature_config, data.document, ctx);

  await ctx.signature.storeSignedDocument(signature, `${signatureId}/${documentId}`, signer);
  await ctx.signature.storeAuditTrail(signature, `${signatureId}/${documentId}`);
}

async function emailDelivered(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [, signerIndex] = await findSigner(signature.signature_config, data.document, ctx);
  await ctx.petitions.updatePetitionSignatureSignerStatusByExternalId(
    signature.external_id!,
    signerIndex,
    { sent_at: new Date(data.created_at) },
  );

  await upsertSignatureDeliveredEvent(
    petitionId,
    data,
    { email_delivered_at: new Date(data.created_at) },
    ctx,
  );
}

async function emailOpened(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  await upsertSignatureDeliveredEvent(
    petitionId,
    data,
    { email_opened_at: new Date(data.created_at) },
    ctx,
  );
}

async function emailBounced(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);

  const [, signerIndex] = await findSigner(signature.signature_config, data.document, ctx);
  await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
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

  await upsertSignatureDeliveredEvent(
    petitionId,
    data,
    { email_bounced_at: new Date(data.created_at) },
    ctx,
  );
}
/** document has expired before every signer could sign it. we need to cancel the request in our DB */
async function documentExpired(ctx: ApiContext, data: SignaturitEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
    cancel_reason: "REQUEST_EXPIRED",
    cancel_data: {},
  });
}

async function fetchPetitionSignature(signatureId: string, ctx: ApiContext) {
  const externalId = `SIGNATURIT/${signatureId}`;
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(externalId);
  if (!signature) {
    throw new Error(`Petition signature request with externalId: ${externalId} not found.`);
  }
  if (signature.status === "CANCELLED") {
    throw new Error(
      `Requested petition signature with id: ${signature.id} was previously cancelled`,
    );
  }

  return signature;
}

async function appendEventLogs(ctx: ApiContext, data: SignaturitEventBody): Promise<void> {
  // data.document.events contain the complete list of events since signature was started
  // we just want to append the last event to the log
  delete data.document.events;
  await ctx.petitions.appendPetitionSignatureEventLogs(`SIGNATURIT/${data.document.signature.id}`, [
    data,
  ]);
}

async function findSigner(
  signatureConfig: Replace<
    PetitionSignatureConfig,
    { signersInfo: (PetitionSignatureConfigSigner & { externalId: string })[] }
  >,
  document: SignaturitEventBody["document"],
  ctx: ApiContext,
): Promise<[PetitionSignatureConfigSigner & { externalId: string }, number]> {
  let signerIndex = signatureConfig.signersInfo.findIndex(
    (signer) => signer.externalId === document.id,
  );

  let signer = signatureConfig.signersInfo[signerIndex];

  if (!signer) {
    // signer not found, it's probably because it has been changed from signaturit dashboard
    // fetch updated signers from signaturit API and update signersInfo array
    const newSignersInfo = await syncSignatureRequestSigners(document.signature.id, ctx);

    signerIndex = newSignersInfo.findIndex((signer) => signer.externalId === document.id);
    signer = newSignersInfo[signerIndex];

    if (!signer) {
      // sync didn't work
      throw new Error(
        `Signer with externalId: ${document.id} not found in signature request SIGNATURIT/${document.signature.id}`,
      );
    }
  }

  return [signer, signerIndex];
}

async function upsertSignatureDeliveredEvent(
  petitionId: number,
  body: SignaturitEventBody,
  data: Pick<
    SignatureDeliveredEvent["data"],
    "email_delivered_at" | "email_opened_at" | "email_bounced_at"
  >,
  ctx: ApiContext,
) {
  const signature = await fetchPetitionSignature(body.document.signature.id, ctx);

  const [signer] = await findSigner(signature.signature_config, body.document, ctx);

  const events = await ctx.petitions.getPetitionEventsByType(petitionId, ["SIGNATURE_DELIVERED"]);

  const signerEvent = events.find((e) => e.data.signer.externalId === signer.externalId);

  if (isNonNullish(signerEvent)) {
    if (isNonNullish(signerEvent.data.email_opened_at) && isNonNullish(data.email_opened_at)) {
      // write the email_opened_at Date only once, so future email opens after signature is completed don't overwrite this date
      return;
    }

    await ctx.petitions.updateEvent(signerEvent.id, {
      ...signerEvent,
      data: {
        ...signerEvent.data,
        ...data,
      },
    });
  } else {
    await ctx.petitions.createEvent({
      type: "SIGNATURE_DELIVERED",
      petition_id: petitionId,
      data: {
        petition_signature_request_id: signature.id,
        signer: pick(signer, ["email", "firstName", "lastName", "externalId"]),
        ...data,
      },
    });
  }
}

async function syncSignatureRequestSigners(signatureExternalId: string, ctx: ApiContext) {
  const signatureRequest = await fetchPetitionSignature(signatureExternalId, ctx);
  const client = ctx.signature.getClient({
    id: signatureRequest.signature_config.orgIntegrationId,
    provider: "SIGNATURIT",
  });

  const signature = await client.getSignatureRequest(signatureExternalId);

  const newSignersInfo = signature.documents.map((signer) => ({
    email: signer.email,
    firstName: signer.name,
    lastName: "",
    externalId: signer.id,
  }));

  const newSignerStatus: Record<
    string,
    Pick<
      SignatureDeliveredEvent["data"],
      "email_delivered_at" | "email_opened_at" | "email_bounced_at"
    >
  > = {};

  const eventLogs = signatureRequest.event_logs as SignaturitEventBody[];

  for (const signer of newSignersInfo) {
    const signerIndex = newSignersInfo.findIndex((s) => s.externalId === signer.externalId);
    const emailDeliveredEvent = eventLogs.find(
      (e) => e.type === "email_delivered" && e.document.id === signer.externalId,
    );
    const emailOpenedEvent = eventLogs.find(
      (e) => e.type === "email_opened" && e.document.id === signer.externalId,
    );
    const emailBouncedEvent = eventLogs.findLast(
      (e) => e.type === "email_bounced" && e.document.id === signer.externalId,
    );

    newSignerStatus[signerIndex] = {
      email_bounced_at: emailBouncedEvent ? new Date(emailBouncedEvent.created_at) : undefined,
      email_delivered_at: emailDeliveredEvent
        ? new Date(emailDeliveredEvent.created_at)
        : undefined,
      email_opened_at: emailOpenedEvent ? new Date(emailOpenedEvent.created_at) : undefined,
    };
  }

  await ctx.petitions.updatePetitionSignatureByExternalId(`SIGNATURIT/${signatureExternalId}`, {
    signature_config: {
      ...signatureRequest.signature_config,
      signersInfo: newSignersInfo,
    },
    signer_status: newSignerStatus,
  });

  return newSignersInfo;
}
