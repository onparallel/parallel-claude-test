import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";
import { PetitionSignatureRequest } from "../../db/__types";
import sanitize from "sanitize-filename";
import { random } from "../../util/token";

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

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const petition = await ctx.petitions.loadPetition(petitionId);
  if (!petition) {
    throw new Error(`Can't find petition with id ${petitionId}`);
  }

  const contact = await ctx.contacts.loadContactByEmail({
    orgId: petition.org_id,
    email: data.document.email,
  });

  const signatureRequest = await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${data.document.signature.id}`,
    {
      status: "CANCELLED",
      cancel_reason: "DECLINED_BY_SIGNER",
      cancel_data: {
        contact_id: contact?.id,
        decline_reason: data.document.decline_reason,
      },
    }
  );

  await appendEventLogs(petitionId, data, ctx);

  await ctx.petitions.createEvent({
    type: "SIGNATURE_CANCELLED",
    petitionId,
    data: {
      petition_signature_request_id: signatureRequest.id,
      cancel_reason: "DECLINED_BY_SIGNER",
      cancel_data: {
        canceller_id: contact?.id,
        canceller_reason: data.document.decline_reason,
      },
    },
  });
}
/** signed document has been completed and is ready to be downloaded */
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

  const contact = await ctx.contacts.loadContactByEmail({
    orgId: petition.org_id,
    email: data.document.email,
  });

  if (!contact) {
    throw new Error(
      `Can't find contact on Org ${petition.org_id} with email ${data.document.email}`
    );
  }

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
    signature: { id: signatureId },
  } = data.document;

  const signature = await fetchPetitionSignature(signatureId, ctx);
  if (signature.status === "CANCELLED") {
    throw new Error(
      `Requested petition signature with externalId: ${signatureId} was previously cancelled`
    );
  }

  const config = signature.signature_config;

  const signedDoc = await storeDocument(
    await client.downloadSignedDocument(`${signatureId}/${documentId}`),
    sanitize(
      `${config.title}_${petition.locale === "es" ? "firmado" : "signed"}.pdf`
    ),
    signaturitIntegration.id,
    ctx
  );

  const signatureRequest = await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${signatureId}`,
    {
      status: "COMPLETED",
      file_upload_id: signedDoc.id,
    }
  );

  await Promise.all([
    ctx.emails.sendPetitionCompletedEmail(petition.id, {
      contactId: contact.id,
    }),
    appendEventLogs(petitionId, data, ctx),
    ctx.petitions.createEvent({
      type: "SIGNATURE_COMPLETED",
      petitionId,
      data: {
        petition_signature_request_id: signatureRequest.id,
        file_upload_id: signedDoc.id,
      },
    }),
    ctx.petitions.updatePetition(
      petitionId,
      { signature_config: null },
      "Webhook:Signaturit"
    ),
  ]);
}

/** audit trail has been completed and is ready to be downloaded */
async function auditTrailCompleted(
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
    signature: { id: signatureId },
  } = data.document;

  const signature = await fetchPetitionSignature(signatureId, ctx);
  if (signature.status === "CANCELLED") {
    throw new Error(
      `Requested petition signature with externalId: ${signatureId} was previously cancelled`
    );
  }

  const config = signature.signature_config;

  const auditTrail = await storeDocument(
    await client.downloadAuditTrail(`${signatureId}/${documentId}`),
    sanitize(`${config.title}_audit_trail.pdf`),
    signaturitIntegration.id,
    ctx
  );

  await ctx.petitions.updatePetitionSignatureByExternalId(
    `SIGNATURIT/${signatureId}`,
    { file_upload_audit_trail_id: auditTrail.id }
  );

  await appendEventLogs(petitionId, data, ctx);
}

async function fetchPetitionSignature(
  signatureId: string,
  ctx: ApiContext
): Promise<PetitionSignatureRequest> {
  const externalId = `SIGNATURIT/${signatureId}`;
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

async function appendEventLogs(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
): Promise<void> {
  await ctx.petitions.appendPetitionSignatureEventLogs(
    `SIGNATURIT/${data.document.signature.id}`,
    [data]
  );
}

async function storeDocument(
  buffer: Buffer,
  filename: string,
  integrationId: number,
  ctx: ApiContext
) {
  const path = random(16);
  const s3Response = await ctx.aws.fileUploads.uploadFile(
    path,
    "application/pdf",
    buffer
  );

  return await ctx.files.createFileUpload(
    {
      content_type: "application/pdf",
      filename,
      path,
      size: s3Response["ContentLength"]!.toString(),
      upload_complete: true,
    },
    `OrgIntegration:${integrationId}`
  );
}
