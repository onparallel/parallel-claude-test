import { promises as fs } from "fs";
import { tmpdir } from "os";
import { resolve } from "path";
import sanitize from "sanitize-filename";
import { URLSearchParams } from "url";
import { WorkerContext } from "../context";
import { Contact, OrgIntegration, Petition } from "../db/__types";
import { fullName } from "../util/fullName";
import { toGlobalId } from "../util/globalId";
import { removeKeys } from "../util/remedaExtensions";
import { random } from "../util/token";
import { calculateSignatureBoxPositions } from "./helpers/calculateSignatureBoxPositions";
import { createQueueWorker } from "./helpers/createQueueWorker";

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

  let removeGeneratedPdf = true;
  const tmpPdfPath = resolve(
    tmpdir(),
    "print",
    random(16),
    sanitize(`${settings.title}.pdf`)
  );

  try {
    const signatureIntegration = await fetchOrgSignatureIntegration(
      petition.org_id,
      settings.provider,
      ctx
    );

    const recipients = await fetchSignatureRecipients(settings.contactIds, ctx);

    const token = ctx.security.generateAuthToken({
      petition: { id: petition.id },
      petitionSignatureRequest: { id: signature.id },
    });

    const buffer = await ctx.printer.pdf(
      `http://localhost:3000/${
        petition.locale
      }/print/petition-pdf?${new URLSearchParams({ token })}`,
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

    const signatureBoxPositions = await calculateSignatureBoxPositions(
      buffer,
      recipients
    );

    const templateData = await fetchTemplateData(petition, ctx);

    const signatureClient = ctx.signature.getClient(signatureIntegration);

    // send request to signature client
    const data = await signatureClient.startSignatureRequest(
      petitionGID,
      tmpPdfPath,
      recipients,
      {
        locale: petition.locale as "en" | "es",
        templateData,
        signingMode: "parallel",
        signatureBoxPositions,
      }
    );

    const provider = signatureIntegration.provider.toUpperCase();

    // remove events array from data before saving to DB
    data.documents = data.documents.map((doc) =>
      removeKeys(doc, ([key]) => key !== "events")
    );

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
    const cancelData = { error: error.stack ?? JSON.stringify(error) } as {
      error: any;
      file?: string;
    };
    if (error.message === "MALFORMED_PDF_ERROR") {
      cancelData.file = tmpPdfPath;
      removeGeneratedPdf = false;
    }
    await ctx.petitions.updatePetitionSignature(signature.id, {
      status: "CANCELLED",
      cancel_reason: "REQUEST_ERROR",
      cancel_data: cancelData,
    });
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

async function fetchTemplateData(petition: Petition, ctx: WorkerContext) {
  const user = await ctx.petitions.loadPetitionOwners(petition.id);
  if (!user) {
    throw new Error(`Can't find OWNER of petition with id ${petition.id}`);
  }

  const org = await ctx.organizations.loadOrg(petition.org_id);
  if (!org) {
    throw new Error(`Org with id ${petition.org_id} not found`);
  }

  const logoUrl = await ctx.organizations.getOrgLogoUrl(petition.org_id);

  const signatureConfig = petition.signature_config as PetitionSignatureConfig;
  return {
    senderFirstName: user.first_name ?? "",
    logoUrl: logoUrl ?? `${ctx.config.misc.assetsUrl}/static/emails/logo.png`,
    logoAlt: org.identifier,
    documentName: signatureConfig.title,
  };
}
