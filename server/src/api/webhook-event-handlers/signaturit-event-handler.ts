import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
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
};

export function signaturItEventHandler(type: SignatureEvents) {
  switch (type) {
    case "document_signed":
      return documentSigned;
    case "document_declined":
      return documentDeclined;
    case "document_completed":
      return documentCompleted;
    case "audit_trail_completed":
      return auditTrailCompleted;
    default:
      return appendEventLogs;
  }
}

/** the document was signed by any of the assigned signers */
async function documentSigned(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const petition = await ctx.petitions.loadPetition(petitionId);
  if (!petition) {
    throw new Error(`petition with id ${petitionId} not found.`);
  }

  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`
  );

  const [signer, signerIndex] = findSigner(signature!.signature_config.signersInfo, data.document);

  await Promise.all([
    ctx.petitions.updatePetitionSignatureByExternalId(`SIGNATURIT/${data.document.signature.id}`, {
      signer_status: { ...signature!.signer_status, [signerIndex]: "SIGNED" },
    }),
    appendEventLogs(ctx, data),
    ctx.petitions.createEvent({
      type: "RECIPIENT_SIGNED",
      petition_id: petition.id,
      data: {
        signer,
        petition_signature_request_id: signature!.id,
      },
    }),
  ]);
}

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const petition = await ctx.petitions.loadPetition(petitionId);
  if (!petition) {
    throw new Error(`Can't find petition with id ${petitionId}`);
  }

  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`
  );

  if (!signature) {
    throw new Error(
      `Can't find PetitionSignatureRequest with external_id: SIGNATURIT/${data.document.signature.id}`
    );
  }

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
          [cancellerIndex]: "DECLINED",
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
