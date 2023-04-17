import stringify from "fast-safe-stringify";
import { readFile, unlink } from "fs/promises";
import pMap from "p-map";
import { isDefined, pick } from "remeda";
import { WorkerContext } from "../context";
import { IntegrationSettings, SignatureProvider } from "../db/repositories/IntegrationRepository";
import { PetitionSignatureConfigSigner } from "../db/repositories/PetitionRepository";
import { ContactLocale, OrgIntegration } from "../db/__types";
import { InvalidCredentialsError } from "../integrations/GenericIntegration";
import {
  CancelAbortedError,
  SignatureResponse,
} from "../services/signature-clients/SignatureClient";
import { fullName } from "../util/fullName";
import { removeKeys } from "../util/remedaExtensions";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { random } from "../util/token";
import { Maybe, Replace } from "../util/types";
import { createQueueWorker } from "./helpers/createQueueWorker";

type SignatureOrgIntegration = Replace<
  OrgIntegration,
  { settings: IntegrationSettings<"SIGNATURE">; provider: SignatureProvider }
>;

/** starts a signature request on the petition */
async function startSignatureProcess(
  payload: { petitionSignatureRequestId: number },
  ctx: WorkerContext
) {
  const enqueued = await ctx.petitions.loadPetitionSignatureById.raw(
    payload.petitionSignatureRequestId
  );
  // the signature wasn't found or with status !== ENQUEUED, ignore and finish
  if (!enqueued || enqueued.status !== "ENQUEUED") {
    return;
  }

  const [signature] = (await ctx.petitions.updatePetitionSignatures(enqueued.id, {
    status: "PROCESSING",
  }))!;

  const petition = await fetchPetition(signature.petition_id, ctx);
  const organization = await ctx.organizations.loadOrg(petition.org_id);
  if (!organization) {
    throw new Error(`Organization:${petition.org_id} not found`);
  }
  if (!petition.signature_config) {
    throw new Error(`Signature is not enabled on petition with id ${signature.petition_id}`);
  }

  const { title, orgIntegrationId, signersInfo, message } = signature.signature_config;

  let documentTmpPath: string | null = null;
  const integration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);
  try {
    const owner = await ctx.petitions.loadPetitionOwner(petition.id);
    const recipients = signersInfo.map((signer) => ({
      name: fullName(signer.firstName, signer.lastName),
      email: signer.email,
    }));

    const outputFileName =
      title || (await getDefaultFileName(petition.id, petition.recipient_locale, ctx));

    documentTmpPath = await ctx.petitionBinder.createBinder(owner!.id, {
      petitionId: petition.id,
      documentTitle: title,
      showSignatureBoxes: true,
      maxOutputSize: 10 * 1024 * 1024, // signaturit has a 15MB limit for emails
      outputFileName,
      includeAnnexedDocuments: true,
    });

    const documentTmpFile = await storeTemporaryDocument(
      documentTmpPath,
      outputFileName,
      integration.id,
      ctx
    );

    await ctx.petitions.updatePetitionSignatures(signature.id, {
      temporary_file_document_id: documentTmpFile.id,
    });

    const signatureClient = ctx.signature.getClient(integration);

    const petitionTheme = await ctx.organizations.loadOrganizationTheme(
      petition.document_organization_theme_id
    );

    if (petitionTheme?.type !== "PDF_DOCUMENT") {
      throw new Error(`Expected theme of type PDF_DOCUMENT on Petition:${petition.id}`);
    }

    // create event before sending request to signature client, no matter the client's response
    await ctx.petitions.createEvent({
      type: "SIGNATURE_STARTED",
      petition_id: petition.id,
      data: {
        petition_signature_request_id: signature.id,
      },
    });

    // send request to signature client
    const data = await signatureClient.startSignatureRequest(
      petition.id,
      petition.org_id,
      documentTmpPath,
      recipients,
      {
        locale: petition.recipient_locale,
        initialMessage: message,
      }
    );

    // remove events array from data before saving to DB
    data.documents = data.documents.map((doc) =>
      removeKeys(doc as any, ([key]) => key !== "events")
    );

    // update signers on signature_config to include the externalId provided by provider so we can match it later on events webhook
    const updatedSignersInfo = signature.signature_config.signersInfo.map(
      (signer, signerIndex) => ({
        ...signer,
        externalId: findSignerExternalId(data.documents, signer, signerIndex),
      })
    );

    await ctx.petitions.updatePetitionSignatures(signature.id, {
      external_id: `${integration.provider.toUpperCase()}/${data.id}`,
      data,
      signature_config: {
        ...signature.signature_config,
        signersInfo: updatedSignersInfo,
      },
      status: "PROCESSED",
    });
  } catch (error) {
    const errorCode =
      error instanceof Error &&
      [
        "MAX_SIZE_EXCEEDED", // pdf binder for signature failed
        "INSUFFICIENT_SIGNATURE_CREDITS", // org lacks signature credits for shared signaturit apikey.includes(error.message)
      ].includes(error.message)
        ? error.message
        : error instanceof InvalidCredentialsError &&
          [
            "CONSENT_REQUIRED", // docusign app needs user consent
            "ACCOUNT_SUSPENDED", // docusign user account has been suspended and can't be used on a production environment
            "INVALID_CREDENTIALS", // signaturit apikey is invalid
          ].includes(error.code)
        ? error.code
        : "UNKNOWN_ERROR";

    await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature, {
      cancel_reason: "REQUEST_ERROR",
      cancel_data: {
        error_code: errorCode,
        error: error instanceof Error ? pick(error, ["message", "stack"]) : stringify(error),
      },
    });

    // update signature_config with additional signers specified by recipient so user can restart the signature request knowing who are the signers
    await ctx.petitions.updatePetition(
      petition.id,
      {
        signature_config: {
          ...petition.signature_config!,
          signersInfo: signature.signature_config.signersInfo,
        },
      },
      `SignatureWorker:${payload.petitionSignatureRequestId}`
    );

    if (errorCode === "UNKNOWN_ERROR") {
      throw error;
    }
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
      return;
    }

    const { orgIntegrationId } = signature.signature_config;

    // here we need to lookup all signature integrations, also disabled and deleted ones
    // this is because the user could have deleted their signature integration, triggering a cancel of all pending signature requests
    const integration = (await ctx.integrations.loadAnySignatureIntegration(
      orgIntegrationId
    )) as SignatureOrgIntegration | null;

    if (!integration) {
      throw new Error(
        `Couldn't find a signature integration for OrgIntegration:${orgIntegrationId}`
      );
    }
    const signatureClient = ctx.signature.getClient(integration);
    await signatureClient.cancelSignatureRequest(signature.external_id.replace(/^.*?\//, ""));

    // after signature client confirmed the cancellation, it's safe to move the signature from CANCELLING to CANCELLED
    await ctx.petitions.updatePetitionSignatureRequestAsCancelled(signature);
  } catch (error) {
    if (!(error instanceof InvalidCredentialsError) && !(error instanceof CancelAbortedError)) {
      throw error;
    }
  }
}

/** sends a reminder email to every pending signer of the signature request */
async function sendSignatureReminder(
  payload: { petitionSignatureRequestId: number; userId: number },
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
    const integration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);

    const signatureClient = ctx.signature.getClient(integration);
    await signatureClient.sendPendingSignatureReminder(signature.external_id.replace(/^.*?\//, ""));

    await ctx.petitions.createEvent({
      type: "SIGNATURE_REMINDER",
      petition_id: signature.petition_id,
      data: {
        user_id: payload.userId,
        petition_signature_request_id: signature.id,
      },
    });
  } catch (error) {
    if (!(error instanceof InvalidCredentialsError)) {
      throw error;
    }
  }
}

async function storeSignedDocument(
  payload: {
    petitionSignatureRequestId: number;
    signedDocumentExternalId: string;
    signer: PetitionSignatureConfigSigner;
  },
  ctx: WorkerContext
) {
  try {
    const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
    if (isDefined(signature.file_upload_id)) {
      // signed document is already available on signature, do nothing
      return;
    }
    const petition = await fetchPetition(signature.petition_id, ctx);

    const { title, orgIntegrationId } = signature.signature_config;

    const integration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);

    const client = ctx.signature.getClient(integration);
    const intl = await ctx.i18n.getIntl(petition.recipient_locale);

    const signedDocument = await storeDocument(
      await client.downloadSignedDocument(payload.signedDocumentExternalId),
      sanitizeFilenameWithSuffix(
        title || (await getDefaultFileName(petition.id, petition.recipient_locale, ctx)),
        `_${intl.formatMessage({
          id: "signature-worker.signed",
          defaultMessage: "signed",
        })}.pdf`
      ),
      integration.id,
      ctx
    );

    await ctx.petitions.createEvent({
      type: "SIGNATURE_COMPLETED",
      petition_id: petition.id,
      data: {
        petition_signature_request_id: payload.petitionSignatureRequestId,
        file_upload_id: signedDocument.id,
      },
    });
    await ctx.petitions.updatePetitionSignatures(payload.petitionSignatureRequestId, {
      status: "COMPLETED",
      cancel_data: null,
      cancel_reason: null,
      file_upload_id: signedDocument.id,
    });
    await ctx.petitions.updatePetition(
      petition.id,
      { signature_config: null }, // when completed, set signature_config to null so the signatures card on replies page don't show a "pending start" row
      `SignatureWorker:${payload.petitionSignatureRequestId}`
    );

    const petitionSignatures = await ctx.petitions.loadPetitionSignaturesByPetitionId(petition.id);
    // don't send email if there is a pending signature request on the petition
    if (
      !petitionSignatures.some((s) => ["ENQUEUED", "PROCESSED", "PROCESSING"].includes(s.status))
    ) {
      await ctx.emails.sendPetitionCompletedEmail(
        petition.id,
        { signer: payload.signer },
        `SignatureWorker:${payload.petitionSignatureRequestId}`
      );
    }
  } catch (error) {
    if (!(error instanceof InvalidCredentialsError)) {
      throw error;
    }
  }
}

async function storeAuditTrail(
  payload: { petitionSignatureRequestId: number; signedDocumentExternalId: string },
  ctx: WorkerContext
) {
  try {
    const signature = await fetchPetitionSignature(payload.petitionSignatureRequestId, ctx);
    if (isDefined(signature.file_upload_audit_trail_id)) {
      // audit trail is already available on signature, do nothing
      return;
    }
    const petition = await fetchPetition(signature.petition_id, ctx);
    const { orgIntegrationId, title } = signature.signature_config;
    const integration = await fetchOrgSignatureIntegration(orgIntegrationId, ctx);
    const client = ctx.signature.getClient(integration);

    const auditTrail = await storeDocument(
      await client.downloadAuditTrail(payload.signedDocumentExternalId),
      sanitizeFilenameWithSuffix(
        title || (await getDefaultFileName(petition.id, petition.recipient_locale, ctx)),
        "_audit_trail.pdf"
      ),
      integration.id,
      ctx
    );

    await ctx.petitions.updatePetitionSignatures(signature.id, {
      file_upload_audit_trail_id: auditTrail.id,
    });
  } catch (error) {
    if (!(error instanceof InvalidCredentialsError)) {
      throw error;
    }
  }
}

async function updateOrganizationBranding(
  payload: {
    orgId: number;
    integrationId: Maybe<number>;
  },
  ctx: WorkerContext
) {
  const signatureIntegrations = await ctx.integrations.loadIntegrationsByOrgId(
    payload.orgId,
    "SIGNATURE"
  );

  await pMap(
    signatureIntegrations,
    async (integration) => {
      // if targeting a single integration for update, make sure to skip every other
      if (isDefined(payload.integrationId) && integration.id !== payload.integrationId) {
        return;
      }

      await ctx.signature.getClient(integration).onOrganizationBrandChange?.(payload.orgId);
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
  [K in HandlerType]: Parameters<(typeof handlers)[K]>[0];
};

export type SignatureWorkerPayload = {
  [K in HandlerType]: {
    type: K;
    payload: SignaturePayload[K];
  };
}[HandlerType];

createQueueWorker(
  "signature-worker",
  async (data, ctx) => {
    await handlers[data.type](data.payload as any, ctx);
  },
  { forkHandlers: true }
);

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

  const [file] = await ctx.files.createFileUpload(
    {
      content_type: "application/pdf",
      filename,
      path,
      size: res["ContentLength"]!.toString(),
      upload_complete: true,
    },
    `OrgIntegration:${integrationId}`
  );
  return file;
}

async function storeTemporaryDocument(
  filePath: string,
  filename: string,
  integrationId: number,
  ctx: WorkerContext
) {
  const path = random(16);
  const buffer = await readFile(filePath);
  const res = await ctx.storage.temporaryFiles.uploadFile(path, "application/pdf", buffer);

  return await ctx.files.createTemporaryFile(
    {
      content_type: "application/pdf",
      filename,
      path,
      size: res["ContentLength"]!.toString(),
    },
    `OrgIntegration:${integrationId}`
  );
}

async function getDefaultFileName(petitionId: number, locale: ContactLocale, ctx: WorkerContext) {
  return (
    (await ctx.petitions.getFirstDefinedTitleFromHeadings(petitionId)) ||
    (await ctx.i18n.getIntl(locale)).formatMessage({
      id: "generic.untitled",
      defaultMessage: "Untitled",
    })
  );
}
