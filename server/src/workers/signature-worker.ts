import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { URLSearchParams } from "url";
import { WorkerContext } from "../context";
import { PetitionSignatureConfigSigner } from "../db/repositories/PetitionRepository";
import { SignatureResponse } from "../services/signature";
import { fullName } from "../util/fullName";
import { toGlobalId } from "../util/globalId";
import { removeKeys } from "../util/remedaExtensions";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { random } from "../util/token";
import { calculateSignatureBoxPositions } from "./helpers/calculateSignatureBoxPositions";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { getLayoutProps } from "./helpers/getLayoutProps";

/** starts a signature request on the petition */
async function startSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);

  if (signature.status !== "ENQUEUED") {
    throw new Error(
      `ENQUEUED petition signature request with id ${payload.petitionSignatureRequestId} not found`
    );
  }
  const petition = await fetchPetition(signature.petition_id, ctx);
  if (!petition.signature_config) {
    throw new Error(`Signature is not enabled on petition with id ${signature.petition_id}`);
  }
  const org = await ctx.organizations.loadOrg(petition.org_id);
  const tone = org!.preferred_tone;

  const { title, orgIntegrationId, signersInfo, message } = signature.signature_config;

  let removeGeneratedPdf = true;
  const tmpPdfPath = resolve(
    tmpdir(),
    "print",
    random(16),
    sanitizeFilenameWithSuffix(title, ".pdf")
  );

  try {
    const signatureIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);

    const recipients = signersInfo.map((signer) => ({
      name: fullName(signer.firstName, signer.lastName),
      email: signer.email,
    }));

    const token = ctx.security.generateAuthToken({
      petitionId: petition.id,
      showSignatureBoxes: true,
      documentTitle: title,
    });

    const buffer = await ctx.printer.pdf(
      `http://localhost:3000/${petition.locale}/print/petition-pdf?${new URLSearchParams({
        token,
      })}`,
      tmpPdfPath
    );

    const signatureBoxPositions = await calculateSignatureBoxPositions(buffer, recipients);

    const signatureClient = ctx.signature.getClient(signatureIntegration);

    // send request to signature client
    const data = await signatureClient.startSignatureRequest(
      toGlobalId("Petition", petition.id),
      tmpPdfPath,
      recipients,
      {
        locale: petition.locale,
        templateData: {
          ...(await getLayoutProps(petition.org_id, ctx)),
          tone,
        },
        signingMode: "parallel",
        signatureBoxPositions,
        initialMessage: message,
      }
    );

    // remove events array from data before saving to DB
    data.documents = data.documents.map((doc) => removeKeys(doc, ([key]) => key !== "events"));

    // update signers on signature_config to include the externalId provided by signaturit so we can match it later
    const updatedSignersInfo = signature.signature_config.signersInfo.map(
      (signer, signerIndex) => ({
        ...signer,
        externalId: findSignerExternalId(data.documents, signer, signerIndex),
      })
    );

    await ctx.petitions.updatePetitionSignature(signature.id, {
      external_id: `${signatureIntegration.provider.toUpperCase()}/${data.id}`,
      data,
      signature_config: {
        ...signature.signature_config,
        signersInfo: updatedSignersInfo,
      },
      status: "PROCESSING",
    });
  } catch (error: any) {
    const cancelData = { error: error.stack ?? JSON.stringify(error) } as {
      error: any;
      file?: string;
    };
    if (error.message === "MALFORMED_PDF_ERROR") {
      cancelData.file = tmpPdfPath;
      removeGeneratedPdf = false;
    }
    await Promise.all([
      ctx.petitions.cancelPetitionSignatureRequest(signature.id, "REQUEST_ERROR", cancelData),
      ctx.petitions.createEvent({
        type: "SIGNATURE_CANCELLED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: signature.id,
          cancel_reason: "REQUEST_ERROR",
          cancel_data: cancelData,
        },
      }),
    ]);
    throw error;
  } finally {
    try {
      if (removeGeneratedPdf) {
        await fs.unlink(tmpPdfPath);
      }
    } catch {}
  }
}

/** cancels the signature request for all signers on the petition */
async function cancelSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
  if (!signature.external_id) {
    throw new Error(
      `Can't find external_id on petition signature request ${payload.petitionSignatureRequestId}`
    );
  }

  const { orgIntegrationId } = signature.signature_config;

  // here we need to lookup all signature integrations, also disabled and deleted ones
  // this is because the user could have deleted their signature integration, triggering a cancel of all pending signature requests
  const signatureIntegration = await ctx.integrations.loadAnyIntegration(orgIntegrationId);

  if (!signatureIntegration || signatureIntegration.type !== "SIGNATURE") {
    throw new Error(`Couldn't find a signature integration for OrgIntegration:${orgIntegrationId}`);
  }
  const signatureClient = ctx.signature.getClient(signatureIntegration);
  await signatureClient.cancelSignatureRequest(signature.external_id.replace(/^.*?\//, ""));
}

/** sends a reminder email to every pending signer of the signature request */
async function sendSignatureReminder(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
  if (signature.status !== "PROCESSING") {
    return;
  }

  if (!signature.external_id) {
    throw new Error(
      `Can't find external_id on petition signature request ${payload.petitionSignatureRequestId}`
    );
  }
  const { orgIntegrationId } = signature.signature_config;
  const signatureIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);

  const signatureClient = ctx.signature.getClient(signatureIntegration);
  await signatureClient.sendPendingSignatureReminder(signature.external_id.replace(/^.*?\//, ""));
}

async function storeSignedDocument(
  payload: {
    petitionSignatureRequestId: number;
    signedDocumentExternalId: string;
    signer: PetitionSignatureConfigSigner;
  },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
  const petition = await fetchPetition(signature.petition_id, ctx);

  const { title, orgIntegrationId } = signature.signature_config;

  const signaturitIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);

  const client = ctx.signature.getClient(signaturitIntegration);

  const signedDocument = await storeDocument(
    await client.downloadSignedDocument(payload.signedDocumentExternalId),
    sanitizeFilenameWithSuffix(title, `_${petition.locale === "es" ? "firmado" : "signed"}.pdf`),
    signaturitIntegration.id,
    ctx
  );

  await Promise.all([
    ctx.emails.sendPetitionCompletedEmail(petition.id, {
      signer: payload.signer,
    }),
    ctx.petitions.createEvent({
      type: "SIGNATURE_COMPLETED",
      petition_id: petition.id,
      data: {
        petition_signature_request_id: payload.petitionSignatureRequestId,
        file_upload_id: signedDocument.id,
      },
    }),
    ctx.petitions.updatePetitionSignature(payload.petitionSignatureRequestId, {
      status: "COMPLETED",
      file_upload_id: signedDocument.id,
    }),
    ctx.petitions.updatePetition(
      petition.id,
      { signature_config: null }, // when completed, set signature_config to null so the signatures card on replies page don't show a "pending start" row
      `OrgIntegration:${signaturitIntegration.id}`
    ),
  ]);
}

async function storeAuditTrail(
  payload: { petitionSignatureRequestId: number; signedDocumentExternalId: string },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);

  const { orgIntegrationId, title } = signature.signature_config;
  const signatureIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);
  const client = ctx.signature.getClient(signatureIntegration);

  const auditTrail = await storeDocument(
    await client.downloadAuditTrail(payload.signedDocumentExternalId),
    sanitizeFilenameWithSuffix(title, "_audit_trail.pdf"),
    signatureIntegration.id,
    ctx
  );

  await ctx.petitions.updatePetitionSignature(signature.id, {
    file_upload_audit_trail_id: auditTrail.id,
  });
}

const handlers = {
  "start-signature-process": startSignatureProcess,
  "cancel-signature-process": cancelSignatureProcess,
  "send-signature-reminder": sendSignatureReminder,
  "store-signed-document": storeSignedDocument,
  "store-audit-trail": storeAuditTrail,
};

type HandlerType = keyof typeof handlers;

export type SignaturePayload = {
  [K in HandlerType]: Parameters<typeof handlers[K]>[0];
};

type SignatureWorkerPayload = {
  [K in HandlerType]: {
    type: K;
    payload: SignaturePayload[K];
  };
}[HandlerType];

createQueueWorker("signature-worker", async (data: SignatureWorkerPayload, ctx) => {
  await handlers[data.type](data.payload as any, ctx);
});

async function fetchOrgSignatureIntegration(orgIntegrationId: number, ctx: WorkerContext) {
  const signatureIntegration = await ctx.integrations.loadIntegration(orgIntegrationId);

  if (!signatureIntegration || signatureIntegration.type !== "SIGNATURE") {
    throw new Error(
      `Couldn't find an enabled signature integration for OrgIntegration:${orgIntegrationId}`
    );
  }

  return signatureIntegration;
}

async function fetchPetition(id: number, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(id);
  if (!petition) {
    throw new Error(`Couldn't find petition with id ${id}`);
  }
  return petition;
}

async function fetchPetitionSignature(petitionSignatureRequestId: number, ctx: WorkerContext) {
  const signature = await ctx.petitions.loadPetitionSignatureById(petitionSignatureRequestId, {
    cache: false,
  });
  if (!signature) {
    throw new Error(`Petition Signature Request with id ${petitionSignatureRequestId} not found`);
  }

  return signature;
}

function findSignerExternalId(
  documents: SignatureResponse["documents"],
  signer: PetitionSignatureConfigSigner,
  signerIndex: number
) {
  const signerByEmail = documents.filter((d) => d.email === signer.email);

  if (signerByEmail.length === 1) {
    // first search by email, if only 1 result found it's a match
    return signerByEmail[0].id;
  } else if (signerByEmail.length > 1) {
    // if more than 1 signer found with the same email, match by position in the array
    const externalId = documents[signerIndex]?.id;
    if (!externalId) {
      throw new Error(
        `Index out of bounds on signature document. document:${JSON.stringify(
          documents
        )}, index: ${signerIndex} `
      );
    }
    return externalId;
  } else if (signerByEmail.length === 0) {
    // if no signers were found with that email, there's an error
    throw new Error(
      `Can't find signer by email on document. signer:${JSON.stringify(
        signer
      )}. documents: ${JSON.stringify(documents)}`
    );
  }
}

async function storeDocument(
  buffer: Buffer,
  filename: string,
  integrationId: number,
  ctx: WorkerContext
) {
  const path = random(16);
  const res = await ctx.aws.fileUploads.uploadFile(path, "application/pdf", buffer);

  return await ctx.files.createFileUpload(
    {
      content_type: "application/pdf",
      filename,
      path,
      size: res["ContentLength"]!.toString(),
      upload_complete: true,
    },
    `OrgIntegration:${integrationId}`
  );
}
