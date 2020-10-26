import { unlinkSync } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { groupBy } from "remeda";
import { WorkerContext } from "../context";
import { ISignatureClient, SignaturItClient } from "../services/signature";
import { fromGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";

/** starts a signature request on the petition for all recipients */
async function startSignatureProcess(
  payload: {
    petitionId: string;
    recipients: { email: string; name: string }[];
  },
  context: WorkerContext
) {
  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;

  const signatureClient: ISignatureClient = new SignaturItClient(
    "OWjTPUJhfPeLMEQAHiGLECOJjoITJypAmNwdsEFdXErfuamBBxDUSBofbpbKQPMJhoGIScVVgURyzmebKhzBsS"
  );
  try {
    // insert a tuple <petitionId, signerEmail> for each of the required signers
    await context.petitions.createPetitionSignature(
      petitionId,
      payload.recipients,
      signatureClient.name
    );

    const tmpPdfPath = resolve(tmpdir(), payload.petitionId.concat(".pdf"));
    await context.printer.pdf("https://www.parallel.so", {
      path: tmpPdfPath,
    });

    const data = await signatureClient.createSignature(
      tmpPdfPath,
      payload.recipients
    );

    await context.petitions.updatePetitionSignature(petitionId, {
      status: "READY_TO_SIGN",
      external_id: data.id,
      data,
    });

    unlinkSync(tmpPdfPath);
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
  const signatureClient: ISignatureClient = new SignaturItClient(
    "OWjTPUJhfPeLMEQAHiGLECOJjoITJypAmNwdsEFdXErfuamBBxDUSBofbpbKQPMJhoGIScVVgURyzmebKhzBsS"
  );

  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const signatures = await context.petitions.loadPetitionSignature(petitionId);

  const filteredSignatures = signatures.filter(
    (s) => s && s.status !== "CANCELED" && s.external_id
  );
  const byExternalId = groupBy(filteredSignatures, (s) => s.external_id);
  Object.keys(byExternalId).forEach(async (externalId) => {
    // just do a request to cancel the signature process.
    // Table petition_signature will be updated as soon as the client confirms the cancelation
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
