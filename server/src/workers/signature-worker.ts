import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { groupBy } from "remeda";
import { WorkerContext } from "../context";
import { fromGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { calculateSignatureBoxPositions } from "./helpers/calculateSignatureBoxPositions";
import { getBaseWebhookUrl } from "./helpers/getBaseWebhookUrl";

/** starts a signature request on the petition for all recipients */
async function startSignatureProcess(
  payload: {
    petitionId: string;
    recipients: { email: string; name: string }[];
  },
  ctx: WorkerContext
) {
  const signatureClient = ctx.signaturit;
  const recipients = payload.recipients;
  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;

  const baseWebhookUrl = await getBaseWebhookUrl(ctx.config.misc.parallelUrl);
  const eventsUrl = `${baseWebhookUrl}/api/webhooks/${signatureClient.name}/${payload.petitionId}/events`;

  await ctx.petitions.createPetitionSignature(
    petitionId,
    payload.recipients,
    signatureClient.name
  );

  // print and save pdf to disk
  const basePrintUrl =
    process.env.NODE_ENV === "production"
      ? ctx.config.misc.parallelUrl
      : "http://localhost";
  const printURL = `${basePrintUrl}/en/petition/print/${
    payload.petitionId
  }?recipients=${encodeURIComponent(JSON.stringify(recipients))}`;

  const tmpPdfPath = resolve(tmpdir(), payload.petitionId.concat(".pdf"));

  const buffer = await ctx.printer.pdf(printURL, {
    path: tmpPdfPath,
    height: "297mm",
    width: "210mm",
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "10mm",
      right: "10mm",
    },
  });

  // send request to signature client
  const data = await signatureClient.createSignature(tmpPdfPath, recipients, {
    events_url: eventsUrl,
    signing_mode: "parallel",
    signature_box_positions: await calculateSignatureBoxPositions(
      buffer,
      recipients
    ),
  });

  await ctx.petitions.updatePetitionSignature(
    petitionId,
    payload.recipients.map((r) => r.email),
    {
      external_id: data.id,
      data,
    }
  );

  await fs.unlink(tmpPdfPath);
}

/** cancels the signature request for all signers on the petition */
async function cancelSignatureProcess(
  payload: { petitionId: string },
  ctx: WorkerContext
) {
  const signatureClient = ctx.signaturit;

  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const signatures = await ctx.petitions.loadPetitionSignature(petitionId);

  const startedSignatures = signatures.filter(
    (s) => s && s.status !== "DOCUMENT_CANCELED" && s.external_id
  );
  const byExternalId = groupBy(startedSignatures, (s) => s.external_id);

  await Promise.all(
    Object.keys(byExternalId).map((externalId) => {
      // do a request to cancel the signature process.
      // Table petition_signature will be updated as soon as the client confirms the cancelation via events webhook
      return signatureClient.cancelSignature(externalId);
    })
  );
}

const handlers = {
  "start-signature-process": startSignatureProcess,
  "cancel-signature-process": cancelSignatureProcess,
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

createQueueWorker<SignatureWorkerPayload>(
  "signature-worker",
  async (data: SignatureWorkerPayload, ctx: WorkerContext) => {
    await handlers[data.type](data.payload as any, ctx);
  }
);
