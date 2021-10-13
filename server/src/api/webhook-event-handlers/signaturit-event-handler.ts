import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";
import { PetitionSignatureConfigSigner } from "../../db/repositories/PetitionRepository";
import { fullName } from "../../util/fullName";
import { sanitizeFilenameWithSuffix } from "../../util/sanitizeFilenameWithSuffix";
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

  const [canceller, cancellerIndex] = findSigner(
    signature!.signature_config.signersInfo,
    data.document
  );

  const [signatureRequest] = await Promise.all([
    ctx.petitions.cancelPetitionSignatureRequestByExternalId(
      `SIGNATURIT/${data.document.signature.id}`,
      "DECLINED_BY_SIGNER",
      {
        canceller,
        decline_reason: data.document.decline_reason,
      },
      {
        signer_status: {
          ...signature!.signer_status,
          [cancellerIndex]: "DECLINED",
        },
      }
    ),
    appendEventLogs(ctx, data),
  ]);

  await ctx.petitions.createEvent({
    type: "SIGNATURE_CANCELLED",
    petition_id: petitionId,
    data: {
      petition_signature_request_id: signatureRequest.id,
      cancel_reason: "DECLINED_BY_SIGNER",
      cancel_data: { canceller, decline_reason: data.document.decline_reason },
    },
  });
}
/** signed document has been completed and is ready to be downloaded */
async function documentCompleted(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const petition = await ctx.petitions.loadPetition(petitionId);

  if (!petition) {
    throw new Error(`petition with id ${petitionId} not found.`);
  }

  const orgIntegration = await ctx.integrations.loadEnabledIntegrationsForOrgId(petition.org_id);

  const signaturitIntegration = orgIntegration.find(
    (i) => i.type === "SIGNATURE" && i.provider === "SIGNATURIT"
  );

  if (!signaturitIntegration) {
    throw new Error(`Can't load SignaturIt integration for org with id ${petition.org_id}`);
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

  const { title } = signature.signature_config;

  const signedDoc = await storeDocument(
    await client.downloadSignedDocument(`${signatureId}/${documentId}`),
    sanitizeFilenameWithSuffix(title, `_${petition.locale === "es" ? "firmado" : "signed"}.pdf`),
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

  const [signer] = findSigner(signature!.signature_config.signersInfo, data.document);

  await Promise.all([
    ctx.emails.sendPetitionCompletedEmail(petition.id, {
      signer,
    }),
    appendEventLogs(ctx, data),
    ctx.petitions.createEvent({
      type: "SIGNATURE_COMPLETED",
      petition_id: petitionId,
      data: {
        petition_signature_request_id: signatureRequest.id,
        file_upload_id: signedDoc.id,
      },
    }),
    ctx.petitions.updatePetition(
      petitionId,
      { signature_config: null }, // when completed, set signature_config to null so the signatures card on replies page don't show a "pending start" row
      `OrgIntegration:${signaturitIntegration.id}`
    ),
  ]);
}

/** audit trail has been completed and is ready to be downloaded */
async function auditTrailCompleted(ctx: ApiContext, data: SignaturItEventBody, petitionId: number) {
  const petition = await ctx.petitions.loadPetition(petitionId);

  if (!petition) {
    throw new Error(`petition with id ${petitionId} not found.`);
  }

  const orgIntegration = await ctx.integrations.loadEnabledIntegrationsForOrgId(petition.org_id);

  const signaturitIntegration = orgIntegration.find(
    (i) => i.type === "SIGNATURE" && i.provider === "SIGNATURIT"
  );

  if (!signaturitIntegration) {
    throw new Error(`Can't load SignaturIt integration for org with id ${petition.org_id}`);
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

  const { title } = signature.signature_config;

  const auditTrail = await storeDocument(
    await client.downloadAuditTrail(`${signatureId}/${documentId}`),
    sanitizeFilenameWithSuffix(title, "_audit_trail.pdf"),
    signaturitIntegration.id,
    ctx
  );

  await ctx.petitions.updatePetitionSignatureByExternalId(`SIGNATURIT/${signatureId}`, {
    file_upload_audit_trail_id: auditTrail.id,
  });

  await appendEventLogs(ctx, data);
}

async function fetchPetitionSignature(signatureId: string, ctx: ApiContext) {
  const externalId = `SIGNATURIT/${signatureId}`;
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(externalId);
  if (!signature) {
    throw new Error(`Petition signature request with externalId: ${externalId} not found.`);
  }

  return signature;
}

async function appendEventLogs(ctx: ApiContext, data: SignaturItEventBody): Promise<void> {
  await ctx.petitions.appendPetitionSignatureEventLogs(`SIGNATURIT/${data.document.signature.id}`, [
    data,
  ]);
}

async function storeDocument(
  buffer: Buffer,
  filename: string,
  integrationId: number,
  ctx: ApiContext
) {
  const path = random(16);
  const s3Response = await ctx.aws.fileUploads.uploadFile(path, "application/pdf", buffer);

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

function findSigner(
  signers: PetitionSignatureConfigSigner[],
  document: SignaturItEventBody["document"]
): [PetitionSignatureConfigSigner, number] {
  const signerIndex = signers.findIndex(
    (signer) =>
      signer.email === document.email &&
      fullName(signer.firstName, signer.lastName) === document.name
  );

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
