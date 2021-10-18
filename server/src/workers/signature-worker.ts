import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { URLSearchParams } from "url";
import { WorkerContext } from "../context";
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

  const { title, provider, signersInfo, message } = signature.signature_config;

  let removeGeneratedPdf = true;
  const tmpPdfPath = resolve(
    tmpdir(),
    "print",
    random(16),
    sanitizeFilenameWithSuffix(title, ".pdf")
  );

  try {
    const signatureIntegration = await fetchOrgSignatureIntegration(petition.org_id, provider, ctx);

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
      {
        path: tmpPdfPath,
        height: "297mm",
        width: "210mm",
        margin: {
          top: "10mm",
          bottom: "10mm",
          left: "10mm",
          right: "10mm",
        },
      }
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
        templateData: await getLayoutProps(petition.org_id, ctx),
        signingMode: "parallel",
        signatureBoxPositions,
        initialMessage: message,
      }
    );

    // remove events array from data before saving to DB
    data.documents = data.documents.map((doc) => removeKeys(doc, ([key]) => key !== "events"));

    await ctx.petitions.updatePetitionSignature(signature.id, {
      external_id: `${provider.toUpperCase()}/${data.id}`,
      data,
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

  const petition = await fetchPetition(signature.petition_id, ctx);
  const { provider } = signature.signature_config;
  const signatureIntegration = await fetchOrgSignatureIntegration(petition.org_id, provider, ctx);

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
  const petition = await fetchPetition(signature.petition_id, ctx);
  const { provider } = signature.signature_config;
  const signatureIntegration = await fetchOrgSignatureIntegration(petition.org_id, provider, ctx);

  const signatureClient = ctx.signature.getClient(signatureIntegration);
  await signatureClient.sendPendingSignatureReminder(signature.external_id.replace(/^.*?\//, ""));
}

const handlers = {
  "start-signature-process": startSignatureProcess,
  "cancel-signature-process": cancelSignatureProcess,
  "send-signature-reminder": sendSignatureReminder,
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

async function fetchOrgSignatureIntegration(orgId: number, provider: string, ctx: WorkerContext) {
  const orgIntegrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(orgId);

  const orgSignatureIntegration = orgIntegrations.find(
    (i) => i.type === "SIGNATURE" && i.provider === provider.toUpperCase()
  );

  if (!orgSignatureIntegration) {
    throw new Error(
      `Couldn't find an enabled ${provider} signature integration for organization with id ${orgId}`
    );
  }

  return orgSignatureIntegration;
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
