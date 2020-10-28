import { unlinkSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { groupBy } from "remeda";
import { WorkerContext } from "../context";
import { SignaturItClient } from "../services/signature";
import { fromGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { getBaseEventsUrl } from "./helpers/getBaseEventsUrl";

/** starts a signature request on the petition for all recipients */
async function startSignatureProcess(
  payload: {
    petitionId: string;
    recipients: { email: string; name: string }[];
  },
  context: WorkerContext
) {
  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const signatureClient = new SignaturItClient(
    "OWjTPUJhfPeLMEQAHiGLECOJjoITJypAmNwdsEFdXErfuamBBxDUSBofbpbKQPMJhoGIScVVgURyzmebKhzBsS"
  );

  // events url is resolved before writing anything to DB, so if the localtunnel fails on develop nothing will be saved
  const eventsUrl = (
    await getBaseEventsUrl(context.config.misc.parallelUrl)
  ).concat(
    `/api/webhooks/${signatureClient.name}/${payload.petitionId}/events`
  );

  try {
    // insert a tuple with status PROCESSING <petitionId, signerEmail> for each of the required signers
    await context.petitions.createPetitionSignature(
      petitionId,
      payload.recipients,
      signatureClient.name
    );

    // print and save pdf to disk
    const tmpPdfPath = resolve(tmpdir(), payload.petitionId.concat(".pdf"));
    await context.printer.pdf("https://www.parallel.so", {
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

    unlinkSync(tmpPdfPath);

    // update table with response
    if (data.documents.every((doc) => doc.status === "in_queue")) {
      await context.petitions.updatePetitionSignature(petitionId, {
        status: "READY_TO_SIGN",
        external_id: data.id,
        data,
      });
    } else {
      await context.petitions.updatePetitionSignature(petitionId, {
        status: "REQUEST_ERROR",
        external_id: data.id,
        data,
      });
    }
  } catch (e) {
    if (e.constraint === "petition_signature_petition_id_signer_email") {
      // whitelisted error
    } else {
      throw e;
    }
  }
}

/** cancels the signature request for all signers on the petition */
async function cancelSignatureProcess(
  payload: { petitionId: string },
  context: WorkerContext
) {
  const signatureClient = new SignaturItClient(
    "OWjTPUJhfPeLMEQAHiGLECOJjoITJypAmNwdsEFdXErfuamBBxDUSBofbpbKQPMJhoGIScVVgURyzmebKhzBsS"
  );

  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const signatures = await context.petitions.loadPetitionSignature(petitionId);

  const startedSignatures = signatures.filter(
    (s) => s && s.status !== "CANCELED" && s.external_id
  );
  const byExternalId = groupBy(startedSignatures, (s) => s.external_id);
  Object.keys(byExternalId).forEach(async (externalId) => {
    // do a request to cancel the signature process.
    // Table petition_signature will be updated as soon as the client confirms the cancelation via events webhook
    await signatureClient.cancelSignature(externalId);
  });
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
