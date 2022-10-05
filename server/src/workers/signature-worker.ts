import { unlink } from "fs/promises";
import pMap from "p-map";
import { isDefined } from "remeda";
import { WorkerContext } from "../context";
import { IntegrationSettings, SignatureProvider } from "../db/repositories/IntegrationRepository";
import {
  PetitionSignatureConfigSigner,
  PetitionSignatureRequestCancelData,
} from "../db/repositories/PetitionRepository";
import { OrgIntegration } from "../db/__types";
import { Tone } from "../emails/utils/types";
import { BrandingIdKey, SignatureResponse } from "../services/signature-clients/client";
import { fullName } from "../util/fullName";
import { toGlobalId } from "../util/globalId";
import { removeKeys, removeNotDefined } from "../util/remedaExtensions";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { random } from "../util/token";
import { Replace } from "../util/types";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { getLayoutProps } from "./helpers/getLayoutProps";

type SignatureOrgIntegration = Replace<
  OrgIntegration,
  { settings: IntegrationSettings<"SIGNATURE">; provider: SignatureProvider }
>;

/** starts a signature request on the petition */
async function startSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const signature = await ctx.petitions.updatePetitionSignature(
    payload.petitionSignatureRequestId,
    { status: "PROCESSING" },
    { status: "ENQUEUED" }
  );

  // the signature wasn't found or with status !== ENQUEUED, ignore and finish
  if (!signature) {
    return;
  }

  const petition = await fetchPetition(signature.petition_id, ctx);
  if (!petition.signature_config) {
    throw new Error(`Signature is not enabled on petition with id ${signature.petition_id}`);
  }

  const org = await fetchOrganization(petition.org_id, ctx);

  const { title, orgIntegrationId, signersInfo, message } = signature.signature_config;

  let documentTmpPath: string | null = null;
  const signatureIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);
  const settings = signatureIntegration.settings as IntegrationSettings<"SIGNATURE">;
  try {
    const owner = await ctx.petitions.loadPetitionOwner(petition.id);
    const recipients = signersInfo.map((signer) => ({
      name: fullName(signer.firstName, signer.lastName),
      email: signer.email,
    }));

    const outputFileName = title || (await getDefaultFileName(petition.id, petition.locale, ctx));

    documentTmpPath = await ctx.petitionBinder.createBinder(owner!.id, {
      petitionId: petition.id,
      documentTitle: title,
      showSignatureBoxes: true,
      maxOutputSize: 10 * 1024 * 1024, // signaturit has a 15MB limit for emails
      outputFileName,
      includeAnnexedDocuments: true,
    });

    const signatureClient = ctx.signature.getClient(signatureIntegration);

    const petitionTheme = await ctx.organizations.loadOrganizationTheme(
      petition.document_organization_theme_id
    );

    if (petitionTheme?.type !== "PDF_DOCUMENT") {
      throw new Error(`Expected theme of type PDF_DOCUMENT on Petition:${petition.id}`);
    }

    // send request to signature client
    const data = await signatureClient.startSignatureRequest(
      toGlobalId("Petition", petition.id),
      toGlobalId("Organization", petition.org_id),
      documentTmpPath,
      recipients,
      {
        locale: petition.locale,
        templateData: {
          ...(await getLayoutProps(petition.org_id, ctx)),
        },
        signingMode: "parallel",
        initialMessage: message,
        pdfDocumentTheme: petitionTheme.data,
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

    // when reaching this part, we can be sure the org has at least 1 signature credit available
    if (signatureIntegration.provider.toUpperCase() === "SIGNATURIT") {
      const signaturitSettings = settings as IntegrationSettings<"SIGNATURE", "SIGNATURIT">;
      if (
        signaturitSettings.CREDENTIALS.API_KEY ===
        ctx.config.signature.signaturitSharedProductionApiKey
      )
        // sets used signature credits += 1
        await ctx.organizations.updateOrganizationCurrentUsageLimitCredits(
          signatureIntegration.org_id,
          "SIGNATURIT_SHARED_APIKEY",
          1
        );
    }

    await ctx.petitions.updatePetitionSignature(signature.id, {
      external_id: `${signatureIntegration.provider.toUpperCase()}/${data.id}`,
      data,
      signature_config: {
        ...signature.signature_config,
        signersInfo: updatedSignersInfo,
      },
      status: "PROCESSED",
    });
  } catch (error: any) {
    const cancelData = {
      error: error.stack ?? JSON.stringify(error),
    } as PetitionSignatureRequestCancelData<"REQUEST_ERROR">;

    if (error.message === "MAX_SIZE_EXCEEDED") {
      cancelData.error_code = "MAX_SIZE_EXCEEDED";
    }

    await ctx.petitions.cancelPetitionSignatureRequest(signature, "REQUEST_ERROR", cancelData);

    if (
      signatureIntegration.provider.toUpperCase() === "SIGNATURIT" &&
      error.message === "Account depleted all it's advanced signature requests"
    ) {
      const signaturitSettings = settings as IntegrationSettings<"SIGNATURE", "SIGNATURIT">;
      await ctx.emails.sendInternalSignaturitAccountDepletedCreditsEmail(
        org.id,
        petition.id,
        signaturitSettings.CREDENTIALS.API_KEY.slice(0, 10)
      );
    }

    throw error;
  } finally {
    try {
      if (isDefined(documentTmpPath)) {
        await unlink(documentTmpPath);
      }
    } catch {}
  }
}

/** cancels the signature request for all signers on the petition */
async function cancelSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  try {
    const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
    if (!signature.external_id) {
      throw new Error(
        `Can't find external_id on petition signature request ${payload.petitionSignatureRequestId}`
      );
    }

    const { orgIntegrationId } = signature.signature_config;

    // here we need to lookup all signature integrations, also disabled and deleted ones
    // this is because the user could have deleted their signature integration, triggering a cancel of all pending signature requests
    const signatureIntegration = (await ctx.integrations.loadAnySignatureIntegration(
      orgIntegrationId
    )) as SignatureOrgIntegration | null;

    if (!signatureIntegration) {
      throw new Error(
        `Couldn't find a signature integration for OrgIntegration:${orgIntegrationId}`
      );
    }
    const signatureClient = ctx.signature.getClient(signatureIntegration);
    await signatureClient.cancelSignatureRequest(signature.external_id.replace(/^.*?\//, ""));
  } catch {}
}

/** sends a reminder email to every pending signer of the signature request */
async function sendSignatureReminder(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  try {
    const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
    if (signature.status !== "PROCESSED") {
      return;
    }

    if (!signature.external_id) {
      throw new Error(
        `Can't find external_id on PetitionSignatureRequest:${payload.petitionSignatureRequestId}`
      );
    }
    const { orgIntegrationId } = signature.signature_config;
    const signatureIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);

    const signatureClient = ctx.signature.getClient(signatureIntegration);
    await signatureClient.sendPendingSignatureReminder(signature.external_id.replace(/^.*?\//, ""));
  } catch {}
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

  const intl = await ctx.i18n.getIntl(petition.locale);

  const signedDocument = await storeDocument(
    await client.downloadSignedDocument(payload.signedDocumentExternalId),
    sanitizeFilenameWithSuffix(
      title || (await getDefaultFileName(petition.id, petition.locale, ctx)),
      `_${intl.formatMessage({
        id: "signature-worker.signed",
        defaultMessage: "signed",
      })}.pdf`
    ),
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
  const petition = await fetchPetition(signature.petition_id, ctx);
  const { orgIntegrationId, title } = signature.signature_config;
  const signatureIntegration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);
  const client = ctx.signature.getClient(signatureIntegration);

  const auditTrail = await storeDocument(
    await client.downloadAuditTrail(payload.signedDocumentExternalId),
    sanitizeFilenameWithSuffix(
      title || (await getDefaultFileName(petition.id, petition.locale, ctx)),
      "_audit_trail.pdf"
    ),
    signatureIntegration.id,
    ctx
  );

  await ctx.petitions.updatePetitionSignature(signature.id, {
    file_upload_audit_trail_id: auditTrail.id,
  });
}

async function updateOrganizationBranding(payload: { orgId: number }, ctx: WorkerContext) {
  const [organization, signatureIntegrations, layoutProps] = await Promise.all([
    ctx.organizations.loadOrg(payload.orgId),
    ctx.integrations.loadIntegrationsByOrgId(payload.orgId, "SIGNATURE"),
    getLayoutProps(payload.orgId, ctx),
  ]);

  if (!organization) {
    return;
  }

  await pMap(
    signatureIntegrations as SignatureOrgIntegration[],
    async (integration) => {
      const settings = integration.settings;
      const definedBrandingIds = removeNotDefined<Record<BrandingIdKey, string | undefined>>({
        EN_FORMAL_BRANDING_ID: settings.EN_FORMAL_BRANDING_ID,
        EN_INFORMAL_BRANDING_ID: settings.EN_INFORMAL_BRANDING_ID,
        ES_FORMAL_BRANDING_ID: settings.ES_FORMAL_BRANDING_ID,
        ES_INFORMAL_BRANDING_ID: settings.ES_INFORMAL_BRANDING_ID,
      });

      const client = ctx.signature.getClient(integration);

      for (const [key, brandingId] of Object.entries(definedBrandingIds)) {
        const [locale, tone]: string[] = key.split("_");
        try {
          await client.updateBranding(brandingId!, {
            locale: locale.toLowerCase(),
            templateData: {
              ...layoutProps,
              theme: {
                ...layoutProps.theme,
                preferredTone: tone as Tone,
              },
            },
          });
        } catch (error) {
          ctx.logger.error(
            `Error updating ${key} branding on OrgIntegration:${integration.id}:`,
            error
          );
        }
      }
    },
    { concurrency: 1 }
  );
}

const handlers = {
  "start-signature-process": startSignatureProcess,
  "cancel-signature-process": cancelSignatureProcess,
  "send-signature-reminder": sendSignatureReminder,
  "store-signed-document": storeSignedDocument,
  "store-audit-trail": storeAuditTrail,
  "update-branding": updateOrganizationBranding,
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

async function fetchOrgSignatureIntegration(
  orgIntegrationId: number,
  ctx: WorkerContext
): Promise<SignatureOrgIntegration> {
  const signatureIntegration = await ctx.integrations.loadIntegration(orgIntegrationId);

  if (!signatureIntegration || signatureIntegration.type !== "SIGNATURE") {
    throw new Error(
      `Couldn't find an enabled signature integration for OrgIntegration:${orgIntegrationId}`
    );
  }

  return signatureIntegration as any;
}

async function fetchPetition(id: number, ctx: WorkerContext) {
  const petition = await ctx.petitions.loadPetition(id);
  if (!petition) {
    throw new Error(`Couldn't find petition with id ${id}`);
  }
  return petition;
}

async function fetchOrganization(id: number, ctx: WorkerContext) {
  const org = await ctx.organizations.loadOrg(id);
  if (!org) {
    throw new Error(`Organization:${id} not found`);
  }
  return org;
}

async function fetchPetitionSignature(petitionSignatureRequestId: number, ctx: WorkerContext) {
  const signature = await ctx.petitions.loadPetitionSignatureById.raw(petitionSignatureRequestId);
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
  const res = await ctx.storage.fileUploads.uploadFile(path, "application/pdf", buffer);

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

async function getDefaultFileName(petitionId: number, locale: string, ctx: WorkerContext) {
  return (
    (await ctx.petitions.getFirstDefinedTitleFromHeadings(petitionId)) ||
    (await ctx.i18n.getIntl(locale)).formatMessage({
      id: "generic.untitled",
      defaultMessage: "Untitled",
    })
  );
}
