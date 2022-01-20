import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";
import { SignatureStartedEvent } from "../../db/events";
import {
  PetitionSignatureConfigSigner,
  PetitionSignatureRequestCancelData,
} from "../../db/repositories/PetitionRepository";
import { toGlobalId } from "../../util/globalId";

export async function validateSignaturitRequest(
  req: Request & { context: ApiContext },
  res: Response,
  next: NextFunction
) {
  const body = req.body as SignaturItEventBody;
  const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${body.document.signature.id}`
  );

  if (signature && signature.status !== "CANCELLED") {
    next();
  } else {
    // status 200 to kill request but avoid sending an error to signaturit
    res.sendStatus(200).end();
  }
}

export type SignaturItEventBody = {
  document: {
    created_at: string;
    decline_reason?: string; // only for document_declined event type
    file: { name: string; pages: string; size: string };
    id: string;
    events?: {
      created_at: string;
      type: SignatureEvents;
      decline_reason?: string;
    }[];
    signature: { id: string };
    email: string;
    name: string;
    status: string;
  };
  created_at: string;
  type: SignatureEvents;
  reason?: string;
};

export function signaturItEventHandler(type: SignatureEvents) {
  switch (type) {
    case "document_opened":
      return documentOpened;
    case "document_signed":
      return documentSigned;
    case "document_declined":
      return documentDeclined;
    case "document_completed":
      return documentCompleted;
    case "audit_trail_completed":
      return auditTrailCompleted;
    case "email_delivered":
      return emailDelivered;
    case "email_opened":
      return emailOpened;
    case "email_bounced":
      return emailBounced;
    default:
      return appendEventLogs;
  }
}

/** a signer opened the signing page on the signature provider */
async function documentOpened(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [signer, signerIndex] = findSigner(signature!.signature_config.signersInfo, data.document);

  await Promise.all([
    ctx.petitions.updatePetitionSignatureByExternalId(signature.external_id!, {
      signer_status: {
        ...signature.signer_status,
        [signerIndex]: { ...signature.signer_status[signerIndex], opened_at: data.created_at },
      },
    }),
    ctx.petitions.createEvent({
      type: "SIGNATURE_OPENED",
      petition_id: petitionId,
      data: {
        signer,
        petition_signature_request_id: signature!.id,
      },
    }),
    appendEventLogs(ctx, data),
  ]);
}

/** the document was signed by any of the assigned signers */
async function documentSigned(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`
  );

  const [signer, signerIndex] = findSigner(signature!.signature_config.signersInfo, data.document);

  await Promise.all([
    ctx.petitions.updatePetitionSignatureByExternalId(`SIGNATURIT/${data.document.signature.id}`, {
      signer_status: {
        ...signature!.signer_status,
        [signerIndex]: { ...signature!.signer_status[signerIndex], signed_at: data.created_at },
      },
    }),
    ctx.petitions.createEvent({
      type: "RECIPIENT_SIGNED",
      petition_id: petitionId,
      data: {
        signer,
        petition_signature_request_id: signature!.id,
      },
    }),
    appendEventLogs(ctx, data),
  ]);
}

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [canceller, cancellerIndex] = findSigner(
    signature.signature_config.signersInfo,
    data.document
  );

  await Promise.all([
    ctx.petitions.cancelPetitionSignatureRequestByExternalId(
      `SIGNATURIT/${data.document.signature.id}`,
      "DECLINED_BY_SIGNER",
      {
        canceller,
        decline_reason: data.document.decline_reason,
      },
      {
        signer_status: {
          ...signature.signer_status,
          [cancellerIndex]: {
            ...signature.signer_status[cancellerIndex],
            declined_at: data.created_at,
          },
        },
      }
    ),
    ctx.petitions.createEvent({
      type: "SIGNATURE_CANCELLED",
      petition_id: petitionId,
      data: {
        petition_signature_request_id: signature.id,
        cancel_reason: "DECLINED_BY_SIGNER",
        cancel_data: { canceller, decline_reason: data.document.decline_reason },
      },
    }),
    appendEventLogs(ctx, data),
  ]);
}
/** signed document has been completed and is ready to be downloaded */
async function documentCompleted(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const {
    id: documentId,
    signature: { id: signatureId },
  } = data.document;

  const signature = await fetchPetitionSignature(signatureId, ctx);

  const [signer] = findSigner(signature!.signature_config.signersInfo, data.document);
  await Promise.all([
    ctx.aws.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petitionId)}`,
      body: {
        type: "store-signed-document",
        payload: {
          petitionSignatureRequestId: signature.id,
          signedDocumentExternalId: `${signatureId}/${documentId}`,
          signer,
        },
      },
    }),
    appendEventLogs(ctx, data),
  ]);
}

/** audit trail has been completed and is ready to be downloaded */
async function auditTrailCompleted(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const {
    id: documentId,
    signature: { id: signatureId },
  } = data.document;

  const signature = await fetchPetitionSignature(signatureId, ctx);

  await Promise.all([
    ctx.aws.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petitionId)}`,
      body: {
        type: "store-audit-trail",
        payload: {
          petitionSignatureRequestId: signature.id,
          signedDocumentExternalId: `${signatureId}/${documentId}`,
        },
      },
    }),
    appendEventLogs(ctx, data),
  ]);
}

async function emailDelivered(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const signature = await fetchPetitionSignature(data.document.signature.id, ctx);
  const [, signerIndex] = findSigner(signature.signature_config.signersInfo, data.document);
  await Promise.all([
    ctx.petitions.updatePetitionSignatureByExternalId(signature.external_id!, {
      signer_status: {
        ...signature.signer_status,
        [signerIndex]: { ...signature.signer_status[signerIndex], sent_at: data.created_at },
      },
    }),
    updateSignatureStartedEvent(petitionId, { email_delivered_at: new Date(data.created_at) }, ctx),
    appendEventLogs(ctx, data),
  ]);
}

async function emailOpened(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  await Promise.all([
    updateSignatureStartedEvent(petitionId, { email_opened_at: new Date(data.created_at) }, ctx),
    appendEventLogs(ctx, data),
  ]);
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

  const cancelData: PetitionSignatureRequestCancelData<"REQUEST_ERROR"> = {
    error: data.reason ?? `email ${data.document.email} bounced`,
    error_code: "EMAIL_BOUNCED",
  };

  await Promise.all([
    ctx.petitions.cancelPetitionSignatureRequestByExternalId(
      `SIGNATURIT/${data.document.signature.id}`,
      "REQUEST_ERROR",
      cancelData
    ),
    updateSignatureStartedEvent(petitionId, { email_bounced_at: new Date(data.created_at) }, ctx),
    ctx.petitions.createEvent({
      type: "SIGNATURE_CANCELLED",
      petition_id: petitionId,
      data: {
        petition_signature_request_id: signature.id,
        cancel_reason: "REQUEST_ERROR",
        cancel_data: cancelData,
      },
    }),
    appendEventLogs(ctx, data),
  ]);
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

  await ctx.petitions.updateEvent(signatureStartedEvent.id, {
    ...signatureStartedEvent,
    data: {
      ...signatureStartedEvent.data,
      ...newData,
    },
  });
}
