import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";
import { PetitionSignatureRequest } from "../../db/__types";

export async function validateSignaturitRequest(
  req: Request & { context: ApiContext },
  res: Response,
  next: NextFunction
) {
  // TODO check req.headers and block by origin on production
  req.context.logger.info(req.headers);
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["origin"] !== "https://api.signaturit.com"
  ) {
    res.sendStatus(403).end();
  }
  const body = req.body as SignaturItEventBody;
  const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
    body.document.signature.id
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

export const signaturItEventHandler: Record<
  string,
  (
    petitionId: number,
    data: SignaturItEventBody,
    context: ApiContext
  ) => Promise<void>
> = {
  document_canceled: documentCanceled,
  document_declined: documentDeclined,
  document_completed: documentCompleted,

  document_expired: updateEventLogs,
  document_opened: updateEventLogs,
  document_signed: updateEventLogs,
  audit_trail_completed: updateEventLogs,
  email_bounced: updateEventLogs,
  email_deferred: updateEventLogs,
  email_delivered: updateEventLogs,
  email_opened: updateEventLogs,
  email_processed: updateEventLogs,
  terms_and_conditions_accepted: updateEventLogs,
};

/** signature process was canceled, need to update petition_signature_request table */
async function documentCanceled(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const signature = await fetchPetitionSignature(
    data.document.signature.id,
    ctx
  );
  await ctx.petitions.updatePetitionSignature(signature.id, {
    status: "CANCELLED",
    data,
    event_logs: (data.document.events ?? []).concat({
      created_at: data.created_at,
      type: data.type,
    }),
  });
}

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const signature = await fetchPetitionSignature(
    data.document.signature.id,
    ctx
  );
  // when a document is declined, the signature request is automatically cancelled for all recipients
  await ctx.petitions.updatePetitionSignature(signature.id, {
    status: "CANCELLED",
    data,
    event_logs: (data.document.events ?? []).concat({
      created_at: data.created_at,
      type: data.type,
      decline_reason: data.document.decline_reason,
    }),
  });
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

  await ctx.petitions.updatePetitionSignature(signature.id, {
    status: "COMPLETED",
    file_upload_id: file.id,
    data,
    event_logs: (data.document.events ?? []).concat({
      created_at: data.created_at,
      type: data.type,
    }),
  });
}

async function fetchPetitionSignature(
  externalId: string,
  ctx: ApiContext
): Promise<PetitionSignatureRequest> {
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    externalId
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
  const signature = await fetchPetitionSignature(
    data.document.signature.id,
    ctx
  );
  debugger;
  await ctx.petitions.updatePetitionSignature(signature.id, {
    event_logs: (data.document.events ?? []).concat({
      created_at: data.created_at,
      type: data.type,
    }),
  });
}
