import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";
import { PetitionSignatureRequest } from "../../db/__types";

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
    case "document_canceled":
      return documentCanceled;
    case "document_declined":
      return documentDeclined;
    case "document_completed":
      return documentCompleted;
    default:
      return updateEventLogs;
  }
}

/** signature process was canceled, need to update petition_signature_request table */
async function documentCanceled(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    {
      status: "CANCELLED",
      data,
      event_logs: (data.document.events ?? []).concat({
        created_at: data.created_at,
        type: data.type,
      }),
    }
  );
}

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  // when a document is declined, the signature request is automatically cancelled for all recipients
  await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    {
      status: "CANCELLED",
      data,
      event_logs: (data.document.events ?? []).concat({
        created_at: data.created_at,
        type: data.type,
        decline_reason: data.document.decline_reason,
      }),
    }
  );
}

/** document has been completed and is ready to be downloaded */
async function documentCompleted(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const petition = await ctx.petitions.loadPetition(petitionId);

  if (!petition) {
    throw new Error(`petition with id ${petitionId} not found.`);
  }

  const orgIntegration = await ctx.integrations.loadEnabledIntegrationsForOrgId(
    petition.org_id
  );

  const signaturitIntegration = orgIntegration.find(
    (i) => i.type === "SIGNATURE" && i.provider === "SIGNATURIT"
  );

  if (!signaturitIntegration) {
    throw new Error(
      `Can't load SignaturIt integration for org with id ${petition.org_id}`
    );
  }
  const client = ctx.signature.getClient(signaturitIntegration);

  const {
    id: documentId,
    signature: { id: externalId },
  } = data.document;

  const signature = await fetchPetitionSignature(externalId, ctx);
  if (signature.status === "CANCELLED") {
    throw new Error(
      `Requested petition signature with externalId: ${externalId} was previously cancelled`
    );
  }

  const buffer = await client.downloadSignedDocument(
    `${externalId}/${documentId}`
  );

  const filename = `${petition.name ?? petitionId}_signed.pdf`;
  const key = `${externalId}/${documentId}/${filename}`;
  await ctx.aws.uploadFile(key, buffer, "application/pdf");
  const file = await ctx.files.createFileUpload(
    {
      content_type: "application/pdf",
      filename,
      path: key,
      size: Buffer.byteLength(buffer),
      upload_complete: true,
    },
    `OrgIntegration:${signaturitIntegration.id}`
  );

  await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    {
      status: "COMPLETED",
      file_upload_id: file.id,
      data,
      event_logs: (data.document.events ?? []).concat({
        created_at: data.created_at,
        type: data.type,
      }),
    }
  );
}

async function fetchPetitionSignature(
  externalId: string,
  ctx: ApiContext
): Promise<PetitionSignatureRequest> {
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    `SIGNATURIT/${externalId}`
  );
  if (!signature) {
    throw new Error(
      `Petition signature request with externalId: ${externalId} not found.`
    );
  }

  return signature;
}

async function updateEventLogs(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
): Promise<void> {
  await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    {
      event_logs: (data.document.events ?? []).concat({
        created_at: data.created_at,
        type: data.type,
      }),
    }
  );
}
