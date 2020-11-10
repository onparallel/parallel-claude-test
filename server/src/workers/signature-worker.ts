import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import { WorkerContext } from "../context";
import { fromGlobalId } from "../util/globalId";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { calculateSignatureBoxPositions } from "./helpers/calculateSignatureBoxPositions";
import { fullName } from "../util/fullName";
import { Contact, OrgIntegration, Petition } from "../db/__types";

type PetitionSignatureConfig = {
  provider: string;
  timezone: string;
  contactIds: number[];
};

/** starts a signature request on the petition for the provided contacts */
async function startSignatureProcess(
  payload: { petitionId: string },
  ctx: WorkerContext
) {
  const petitionId = fromGlobalId(payload.petitionId, "Petition").id;
  const petition = await fetchPetition(petitionId, ctx);
  if (!petition.signature_config) {
    throw new Error(
      `Signature is not enabled on petition with id ${petitionId}`
    );
  }

  const tmpPdfPath = resolve(
    tmpdir(),
    `${petition.name ?? payload.petitionId}.pdf`
  );
  try {
    const orgSignatureIntegration = await fetchOrgSignatureIntegration(
      petition.org_id,
      ctx
    );

    const settings = petition.signature_config as PetitionSignatureConfig;

    const recipients = await fetchSignatureRecipients(settings.contactIds, ctx);

    const {
      id: petitionSignatureRequestId,
    } = await ctx.petitions.createPetitionSignature(petitionId, settings);

    const token = ctx.signature.generateAuthToken({
      petitionSignatureRequestId,
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

    const signatureClient = ctx.signature.getClient(orgSignatureIntegration);

    // send request to signature client
    const data = await signatureClient.startSignatureRequest(
      payload.petitionId,
      tmpPdfPath,
      recipients,
      {
        signing_mode: "parallel",
        signature_box_positions: signatureBoxPositions,
      }
    );

    const provider = orgSignatureIntegration.provider.toUpperCase();
    await ctx.petitions.updatePetitionSignature(petitionSignatureRequestId, {
      external_id: `${provider}/${data.id}`,
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
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const petitionSignatureRequest = await ctx.petitions.loadPetitionSignatureById(
    payload.petitionSignatureRequestId
  );
  if (!petitionSignatureRequest) {
    throw new Error(
      `Petition Signature Request with id ${payload.petitionSignatureRequestId} not found`
    );
  }
  if (!petitionSignatureRequest || !petitionSignatureRequest.external_id) {
    throw new Error(
      `Can't find external_id on petition signature request ${payload.petitionSignatureRequestId}`
    );
  }

  if (petitionSignatureRequest.status !== "PROCESSING") {
    throw new Error(
      `Can't cancel a ${petitionSignatureRequest.status} signature process.`
    );
  }

  const petitionId = petitionSignatureRequest.petition_id;
  const petition = await fetchPetition(petitionId, ctx);

  const signatureIntegration = await fetchOrgSignatureIntegration(
    petition.org_id,
    ctx
  );

  const signatureClient = ctx.signature.getClient(signatureIntegration);

  // do a request to cancel the signature process.
  // Table petition_signature_request will be updated as soon as the client confirms the cancelation via events webhook
  const externalId = petitionSignatureRequest.external_id.replace(/^.*?\//, "");
  await signatureClient.cancelSignatureRequest(externalId);
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
  ctx: WorkerContext
): Promise<OrgIntegration> {
  const orgIntegrations = await ctx.integrations.loadEnabledIntegrationsForOrgId(
    orgId
  );

  const orgSignatureIntegration = orgIntegrations.find(
    (i) => i.type === "SIGNATURE"
  );

  if (!orgSignatureIntegration) {
    throw new Error(
      `Couldn't find any enabled signature integration for organization with id ${orgId}`
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
