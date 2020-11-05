import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { countBy } from "remeda";
import { WorkerContext } from "../context";
import { fromGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { calculateSignatureBoxPositions } from "./helpers/calculateSignatureBoxPositions";
import { getBaseWebhookUrl } from "./helpers/getBaseWebhookUrl";
import { fullName } from "../util/fullName";
import { Contact } from "../db/__types";

/** starts a signature request on the petition for the provided contacts */
async function startSignatureProcess(
  payload: {
    petitionId: string;
    settings: {
      provider: string;
      contactIds: number[];
      timezone: string;
      locale: string;
    };
  },
  ctx: WorkerContext
) {
  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const petition = await ctx.petitions.loadPetition(petitionId);
  const tmpPdfPath = resolve(
    tmpdir(),
    `${petition?.name ?? payload.petitionId}.pdf`
  );
  try {
    const signatureClient = ctx.signature.getClient(payload.settings.provider);

    const contacts = (
      await ctx.contacts.loadContact(payload.settings.contactIds)
    ).filter((c) => !!c) as Contact[];

    if (contacts.length !== payload.settings.contactIds.length) {
      throw new Error(
        `Couldn't load all required contacts: ${payload.settings.contactIds.toString()}`
      );
    }

    const recipients = contacts.map((c) => ({
      email: c.email,
      name: fullName(c.first_name, c.last_name) ?? "",
    }));

    const baseEventsUrl = await getBaseWebhookUrl(ctx.config.misc.parallelUrl);
    const eventsUrl = `${baseEventsUrl}/api/webhooks/${payload.settings.provider}/${payload.petitionId}/events`;

    // insert before printing, so the pdf view can access the signature settings
    const {
      id: petitionSignatureId,
    } = await ctx.petitions.createPetitionSignature(
      fromGlobalId(payload.petitionId, "Petition").id,
      payload.settings
    );

    // print and save pdf to disk
    const basePrintUrl =
      process.env.NODE_ENV === "production"
        ? ctx.config.misc.parallelUrl
        : "http://localhost";

    const printURL = `${basePrintUrl}/petition-signature/${payload.petitionId}`;

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
    const signatureBoxPositions = await calculateSignatureBoxPositions(
      buffer,
      recipients
    );
    if (
      countBy(
        signatureBoxPositions,
        (pageSignature) => pageSignature.length > 0
      ) === 0
    ) {
      throw new Error(
        "couldn't find signature box positions on the signature pdf"
      );
    }

    const data = await signatureClient.startSignatureRequest(
      tmpPdfPath,
      recipients,
      {
        events_url: eventsUrl,
        signing_mode: "parallel",
        signature_box_positions: signatureBoxPositions,
      }
    );

    await ctx.petitions.updatePetitionSignature(petitionSignatureId, {
      external_id: data.id,
      data,
    });
  } finally {
    try {
      await fs.unlink(tmpPdfPath);
    } catch {}
  }
}

/** cancels the signature request for all signers on the petition */
async function cancelSignatureProcess(
  payload: { petitionId: string; provider: string },
  ctx: WorkerContext
) {
  const signatureClient = ctx.signature.getClient(payload.provider);

  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const signature = await ctx.petitions.loadPetitionSignatureByPetitionId(
    petitionId
  );

  if (!signature || !signature.external_id) {
    throw new Error(
      `Can't find external_id for signature on petition ${petitionId}`
    );
  }

  if (signature.status !== "PROCESSING") {
    throw new Error(`Can't cancel a ${signature.status} signature process`);
  }
  // do a request to cancel the signature process.
  // Table petition_signature_request will be updated as soon as the client confirms the cancelation via events webhook
  await signatureClient.cancelSignatureRequest(signature.external_id);
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
