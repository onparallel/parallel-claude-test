import { unlinkSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { groupBy } from "remeda";
import { WorkerContext } from "../context";
import { fromGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";
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
  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;

  const eventsUrl = (
    await getBaseWebhookUrl(ctx.config.misc.parallelUrl)
  ).concat(
    `/api/webhooks/${signatureClient.name}/${payload.petitionId}/events`
  );

  try {
    await ctx.petitions.createPetitionSignature(
      petitionId,
      payload.recipients,
      signatureClient.name
    );

    // print and save pdf to disk
    const tmpPdfPath = resolve(tmpdir(), payload.petitionId.concat(".pdf"));
    await ctx.printer.pdf("https://www.parallel.so", {
      path: tmpPdfPath,
    });

    // send request to signature client
    const data = await signatureClient.createSignature(
      tmpPdfPath,
      payload.recipients,
      {
        events_url: eventsUrl,
      }
    );

    await ctx.petitions.updatePetitionSignature(
      petitionId,
      payload.recipients.map((r) => r.email),
      {
        external_id: data.id,
        data,
      }
    );

    unlinkSync(tmpPdfPath);
  } catch (e) {
    if (e.constraint === "petition_signature_petition_id_signer_email") {
      console.error(e);
      // whitelisted error
    } else {
      throw e;
    }
  }
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
