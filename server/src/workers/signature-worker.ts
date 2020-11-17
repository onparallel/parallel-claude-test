import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { WorkerContext } from "../context";
import { toGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { calculateSignatureBoxPositions } from "./helpers/calculateSignatureBoxPositions";
import { fullName } from "../util/fullName";
import { Contact, OrgIntegration, Petition } from "../db/__types";
import sanitize from "sanitize-filename";

type PetitionSignatureConfig = {
  provider: string;
  timezone: string;
  contactIds: number[];
  title: string;
};

/** starts a signature request on the petition */
async function startSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(
    payload.petitionSignatureRequestId,
    ctx
  );

  if (signature.status !== "ENQUEUED") {
    throw new Error(
      `ENQUEUED petition signature request with id ${payload.petitionSignatureRequestId} not found`
    );
  }
  const petition = await fetchPetition(signature.petition_id, ctx);
  if (!petition.signature_config) {
    throw new Error(
      `Signature is not enabled on petition with id ${signature.petition_id}`
    );
  }

  const petitionGID = toGlobalId("Petition", signature.petition_id);
  const settings = petition.signature_config as PetitionSignatureConfig;
  const tmpPdfPath = resolve(tmpdir(), sanitize(`${settings.title}.pdf`));

  try {
    const signatureIntegration = await fetchOrgSignatureIntegration(
      petition.org_id,
      settings.provider,
      ctx
    );

    const recipients = await fetchSignatureRecipients(settings.contactIds, ctx);

    const token = ctx.signature.generateAuthToken({
      petitionSignatureRequestId: signature.id,
    });

    // print and save pdf to disk
    const printURL = `${ctx.config.misc.parallelUrl}/${
      petition.locale
    }/print/petition-signature?token=${encodeURIComponent(token)}`;
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

    const signatureBoxPositions = await calculateSignatureBoxPositions(
      buffer,
      recipients
    );

    const signatureClient = ctx.signature.getClient(signatureIntegration);

    // send request to signature client
    const data = await signatureClient.startSignatureRequest(
      petitionGID,
      tmpPdfPath,
      recipients,
      {
        signing_mode: "parallel",
        signature_box_positions: signatureBoxPositions,
      }
    );

    const provider = signatureIntegration.provider.toUpperCase();

    await Promise.all([
      ctx.petitions.updatePetitionSignature(signature.id, {
        external_id: `${provider}/${data.id}`,
        data,
        status: "PROCESSING",
      }),

      ctx.petitions.createEvent({
        type: "SIGNATURE_STARTED",
        petitionId: signature.petition_id,
        data: {
          petition_signature_request_id: signature.id,
        },
      }),
    ]);
  } catch (error) {
    await ctx.petitions.updatePetitionSignature(signature.id, {
      status: "CANCELLED",
      cancel_reason: "REQUEST_ERROR",
      cancel_data: error,
    });
    throw error;
  } finally {
    try {
      await fs.unlink(tmpPdfPath);
    } catch {}
  }
}

/** cancels the signature request for all signers on the petition */
async function cancelSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const signature = await fetchPetitionSignature(
    payload.petitionSignatureRequestId,
    ctx
  );
  if (!signature.external_id) {
    throw new Error(
      `Can't find external_id on petition signature request ${payload.petitionSignatureRequestId}`
    );
  }

  const petition = await fetchPetition(signature.petition_id, ctx);
  const config = petition.signature_config as PetitionSignatureConfig;
  const signatureIntegration = await fetchOrgSignatureIntegration(
    petition.org_id,
    config.provider,
    ctx
  );

  const signatureClient = ctx.signature.getClient(signatureIntegration);
  await signatureClient.cancelSignatureRequest(
    signature.external_id.replace(/^.*?\//, "")
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

createQueueWorker(
  "signature-worker",
  async (data: SignatureWorkerPayload, ctx) => {
    await handlers[data.type](data.payload as any, ctx);
  }
);

async function fetchOrgSignatureIntegration(
  orgId: number,
  provider: string,
  ctx: WorkerContext
): Promise<OrgIntegration> {
  const orgIntegrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(
    orgId
  );

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

async function fetchPetition(
  id: number,
  ctx: WorkerContext
): Promise<Petition> {
  const petition = await ctx.petitions.loadPetition(id);
  if (!petition) {
    throw new Error(`Couldn't find petition with id ${id}`);
  }
  return petition;
}

async function fetchSignatureRecipients(
  contactIds: number[],
  ctx: WorkerContext
) {
  const contacts = (await ctx.contacts.loadContact(contactIds)).filter(
    (c) => !!c
  ) as Contact[];

  if (contacts.length !== contactIds.length) {
    throw new Error(
      `Couldn't load all required contacts: ${contactIds.toString()}`
    );
  }

  return contacts.map((c) => ({
    email: c.email,
    name: fullName(c.first_name, c.last_name) ?? "",
  }));
}

async function fetchPetitionSignature(
  petitionSignatureRequestId: number,
  ctx: WorkerContext
) {
  const signature = await ctx.petitions.loadPetitionSignatureById(
    petitionSignatureRequestId,
    { cache: false }
  );
  if (!signature) {
    throw new Error(
      `Petition Signature Request with id ${petitionSignatureRequestId} not found`
    );
  }

  return signature;
}
