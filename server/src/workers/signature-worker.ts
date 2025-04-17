import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { readFile } from "fs/promises";
import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isNonNullish } from "remeda";
import { CONFIG, Config } from "../config";
import { ContactLocale, OrgIntegration } from "../db/__types";
import { FileRepository } from "../db/repositories/FileRepository";
import {
  IntegrationProvider,
  IntegrationRepository,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import {
  PetitionRepository,
  PetitionSignatureConfigSigner,
} from "../db/repositories/PetitionRepository";
import { InvalidCredentialsError } from "../integrations/helpers/GenericIntegration";
import {
  CancelAbortedError,
  SIGNATURE_CLIENT_FACTORY,
  SignatureClientFactory,
  SignatureResponse,
} from "../integrations/signature/SignatureClient";
import { SignaturitRequestError } from "../integrations/signature/SignaturitClient";
import { EMAILS, EmailsService } from "../services/EmailsService";
import { I18N_SERVICE, I18nService } from "../services/I18nService";
import { PETITION_BINDER, PetitionBinder } from "../services/PetitionBinder";
import { STORAGE_SERVICE, StorageService } from "../services/StorageService";
import { fullName } from "../util/fullName";
import { removeKeys } from "../util/remedaExtensions";
import { sanitizeFilenameWithSuffix } from "../util/sanitizeFilenameWithSuffix";
import { random } from "../util/token";
import { Maybe, Replace } from "../util/types";
import { withTempDir } from "../util/withTempDir";
import { createQueueWorker, QueueWorker } from "./helpers/createQueueWorker";

type SignatureOrgIntegration = Replace<
  OrgIntegration,
  { settings: IntegrationSettings<"SIGNATURE">; provider: IntegrationProvider<"SIGNATURE"> }
>;

type Handlers = {
  "start-signature-process": SignatureWorker["startSignatureProcess"];
  "cancel-signature-process": SignatureWorker["cancelSignatureProcess"];
  "send-signature-reminder": SignatureWorker["sendSignatureReminder"];
  "store-signed-document": SignatureWorker["storeSignedDocument"];
  "store-audit-trail": SignatureWorker["storeAuditTrail"];
  "update-branding": SignatureWorker["updateOrganizationBranding"];
};

export type SignatureWorkerPayload = {
  [K in keyof Handlers]: {
    type: K;
    payload: Parameters<Handlers[K]>[0];
  };
}[keyof Handlers];

@injectable()
export class SignatureWorker extends QueueWorker<SignatureWorkerPayload> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(PETITION_BINDER) private petitionBinder: PetitionBinder,
    @inject(SIGNATURE_CLIENT_FACTORY) private signatureClientFactory: SignatureClientFactory,
    @inject(STORAGE_SERVICE) private storage: StorageService,
    @inject(EMAILS) private emails: EmailsService,
    @inject(I18N_SERVICE) private i18n: I18nService,
    @inject(CONFIG) private config: Config,
  ) {
    super();
  }

  override async handler(payload: SignatureWorkerPayload) {
    const handlers = {
      "start-signature-process": this.startSignatureProcess,
      "cancel-signature-process": this.cancelSignatureProcess,
      "send-signature-reminder": this.sendSignatureReminder,
      "store-signed-document": this.storeSignedDocument,
      "store-audit-trail": this.storeAuditTrail,
      "update-branding": this.updateOrganizationBranding,
    } satisfies Handlers;
    await (handlers[payload.type] as any).call(this, payload.payload);
  }

  /** starts a signature request on the petition */
  async startSignatureProcess(payload: { petitionSignatureRequestId: number }) {
    const enqueued = await this.petitions.loadPetitionSignatureById.raw(
      payload.petitionSignatureRequestId,
    );
    // the signature wasn't found or with status !== ENQUEUED, ignore and finish
    if (!enqueued || enqueued.status !== "ENQUEUED") {
      return;
    }

    const [signature] = (await this.petitions.updatePetitionSignatures(enqueued.id, {
      status: "PROCESSING",
    }))!;

    const petition = await this.fetchPetition(signature.petition_id);
    const organization = await this.organizations.loadOrg(petition.org_id);
    if (!organization) {
      throw new Error(`Organization:${petition.org_id} not found`);
    }
    if (!petition.signature_config?.isEnabled) {
      throw new Error(`Signature is not enabled on petition with id ${signature.petition_id}`);
    }

    const {
      title,
      orgIntegrationId,
      signersInfo,
      message,
      signingMode,
      customDocumentTemporaryFileId,
    } = signature.signature_config;

    const integration = await this.fetchOrgSignatureIntegration(orgIntegrationId);
    try {
      const owner = await this.petitions.loadPetitionOwner(petition.id);
      const recipients = signersInfo.map((signer) => ({
        name: fullName(signer.firstName, signer.lastName),
        email: signer.email,
      }));

      const outputFileName =
        title || (await this.getDefaultFileName(petition.id, petition.recipient_locale));

      await using tempDir = await withTempDir();
      const documentTmpPath = await this.petitionBinder.createBinder(owner!.id, {
        petitionId: petition.id,
        documentTitle: title,
        showSignatureBoxes: true,
        maxOutputSize: 10 * 1024 * 1024, // signaturit has a 15MB limit for emails
        outputFileName,
        includeAnnexedDocuments: true,
        customDocumentTemporaryFileId,
        outputFilePath: tempDir.path,
      });

      const documentTmpFile = await this.storeTemporaryDocument(documentTmpPath, outputFileName);

      await this.petitions.updatePetitionSignatures(signature.id, {
        temporary_file_document_id: documentTmpFile.id,
      });

      const client = this.signatureClientFactory(integration.provider, integration.id);

      const petitionTheme = await this.organizations.loadOrganizationTheme(
        petition.document_organization_theme_id,
      );

      if (petitionTheme?.type !== "PDF_DOCUMENT") {
        throw new Error(`Expected theme of type PDF_DOCUMENT on Petition:${petition.id}`);
      }

      // create event before sending request to signature client, no matter the client's response
      await this.petitions.createEvent({
        type: "SIGNATURE_STARTED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: signature.id,
        },
      });

      // send request to signature client
      const data = await client.startSignatureRequest(
        petition.id,
        petition.org_id,
        documentTmpPath,
        recipients,
        {
          locale: petition.recipient_locale,
          initialMessage: message,
          signingMode,
        },
      );

      // remove events array from data before saving to DB
      data.documents = data.documents.map((doc) =>
        removeKeys(doc as any, ([key]) => key !== "events"),
      );

      // update signers on signature_config to include the externalId provided by provider so we can match it later on events webhook
      const updatedSignersInfo = signature.signature_config.signersInfo.map(
        (signer, signerIndex) => ({
          ...signer,
          externalId: this.findSignerExternalId(data.documents, signer, signerIndex),
        }),
      );

      await this.petitions.updatePetitionSignatures(signature.id, {
        external_id: `${integration.provider.toUpperCase()}/${data.id}`,
        data,
        signature_config: {
          ...signature.signature_config,
          signersInfo: updatedSignersInfo,
        },
        status: "PROCESSED",
        processed_by: this.config.instanceName,
      });
    } catch (error) {
      const errorCode =
        error instanceof Error &&
        [
          "MAX_SIZE_EXCEEDED", // pdf binder for signature failed
          "INSUFFICIENT_SIGNATURE_CREDITS", // org lacks signature credits for shared signaturit apikey
        ].includes(error.message)
          ? error.message
          : error instanceof InvalidCredentialsError &&
              [
                "CONSENT_REQUIRED", // docusign app needs user consent
                "ACCOUNT_SUSPENDED", // docusign user account has been suspended and can't be used on a production environment
                "INVALID_CREDENTIALS", // signaturit apikey is invalid
              ].includes(error.code)
            ? error.code
            : error instanceof SignaturitRequestError
              ? error.code
              : "UNKNOWN_ERROR";

      await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id, {
        cancel_reason: "REQUEST_ERROR",
        cancel_data: {
          error_code: errorCode,
          error:
            isNonNullish(error) && typeof error === "object" && "message" in error
              ? error.message
              : null,
        },
      });

      // update signature_config with additional signers specified by recipient so user can restart the signature request knowing who are the signers
      await this.petitions.updatePetition(
        petition.id,
        {
          signature_config: {
            ...petition.signature_config!,
            signersInfo: signature.signature_config.signersInfo,
          },
        },
        this.config.instanceName,
      );

      if (errorCode === "UNKNOWN_ERROR") {
        throw error;
      }
    }
  }

  /** cancels the signature request for all signers on the petition */
  async cancelSignatureProcess(payload: { petitionSignatureRequestId: number }) {
    try {
      const signature = await this.fetchPetitionSignature(payload.petitionSignatureRequestId);
      if (!signature.external_id) {
        return;
      }

      const { orgIntegrationId } = signature.signature_config;

      // here we need to lookup all signature integrations, also disabled and deleted ones
      // this is because the user could have deleted their signature integration, triggering a cancel of all pending signature requests
      const integration = (await this.integrations.loadAnySignatureIntegration(
        orgIntegrationId,
      )) as SignatureOrgIntegration | null;

      if (!integration) {
        throw new Error(
          `Couldn't find a signature integration for OrgIntegration:${orgIntegrationId}`,
        );
      }
      const client = this.signatureClientFactory(integration.provider, integration.id);
      await client.cancelSignatureRequest(signature.external_id.replace(/^.*?\//, ""));

      // after signature client confirmed the cancellation, it's safe to move the signature from CANCELLING to CANCELLED
      await this.petitions.updatePetitionSignatureRequestAsCancelled(signature.id);
    } catch (error) {
      if (!(error instanceof InvalidCredentialsError) && !(error instanceof CancelAbortedError)) {
        throw error;
      }
    }
  }

  /** sends a reminder email to every pending signer of the signature request */
  async sendSignatureReminder(payload: { petitionSignatureRequestId: number; userId: number }) {
    try {
      const signature = await this.fetchPetitionSignature(payload.petitionSignatureRequestId);
      if (signature.status !== "PROCESSED") {
        return;
      }

      if (!signature.external_id) {
        throw new Error(
          `Can't find external_id on PetitionSignatureRequest:${payload.petitionSignatureRequestId}`,
        );
      }
      const { orgIntegrationId } = signature.signature_config;
      const integration = await this.fetchOrgSignatureIntegration(orgIntegrationId);

      const client = this.signatureClientFactory(integration.provider, integration.id);
      await client.sendPendingSignatureReminder(signature.external_id.replace(/^.*?\//, ""));

      await this.petitions.createEvent({
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

  async storeSignedDocument(payload: {
    petitionSignatureRequestId: number;
    signedDocumentExternalId: string;
    signer: PetitionSignatureConfigSigner;
  }) {
    try {
      const signature = await this.fetchPetitionSignature(payload.petitionSignatureRequestId);
      if (isNonNullish(signature.file_upload_id)) {
        // signed document is already available on signature, do nothing
        return;
      }
      const petition = await this.fetchPetition(signature.petition_id);

      const { title, orgIntegrationId } = signature.signature_config;

      const integration = await this.fetchOrgSignatureIntegration(orgIntegrationId);

      const client = this.signatureClientFactory(integration.provider, integration.id);
      const intl = await this.i18n.getIntl(petition.recipient_locale);

      const signedDocument = await this.storeDocument(
        await client.downloadSignedDocument(payload.signedDocumentExternalId),
        sanitizeFilenameWithSuffix(
          title || (await this.getDefaultFileName(petition.id, petition.recipient_locale)),
          `_${intl.formatMessage({
            id: "signature-worker.signed",
            defaultMessage: "signed",
          })}.pdf`,
        ),
        integration.id,
      );

      await this.petitions.createEvent({
        type: "SIGNATURE_COMPLETED",
        petition_id: petition.id,
        data: {
          petition_signature_request_id: payload.petitionSignatureRequestId,
          file_upload_id: signedDocument.id,
        },
      });
      await this.petitions.updatePetitionSignatures(payload.petitionSignatureRequestId, {
        status: "COMPLETED",
        cancel_data: null,
        cancel_reason: null,
        file_upload_id: signedDocument.id,
      });
      await this.petitions.updatePetition(
        petition.id,
        {
          // when completed, turn signature_config "off" so the signatures card on replies page don't show a "pending start" row
          signature_config: {
            ...petition.signature_config!,
            isEnabled: false,
          },
        },
        this.config.instanceName,
      );

      const petitionSignatures = await this.petitions.loadPetitionSignaturesByPetitionId(
        petition.id,
      );
      // don't send email if there is a pending signature request on the petition
      if (
        !petitionSignatures.some((s) => ["ENQUEUED", "PROCESSED", "PROCESSING"].includes(s.status))
      ) {
        await this.emails.sendPetitionCompletedEmail(
          petition.id,
          { signer: payload.signer },
          this.config.instanceName,
        );
      }
    } catch (error) {
      if (!(error instanceof InvalidCredentialsError)) {
        throw error;
      }
    }
  }

  async storeAuditTrail(payload: {
    petitionSignatureRequestId: number;
    signedDocumentExternalId: string;
  }) {
    try {
      const signature = await this.fetchPetitionSignature(payload.petitionSignatureRequestId);
      if (isNonNullish(signature.file_upload_audit_trail_id)) {
        // audit trail is already available on signature, do nothing
        return;
      }
      const petition = await this.fetchPetition(signature.petition_id);
      const { orgIntegrationId, title } = signature.signature_config;
      const integration = await this.fetchOrgSignatureIntegration(orgIntegrationId);
      const client = this.signatureClientFactory(integration.provider, integration.id);

      const auditTrail = await this.storeDocument(
        await client.downloadAuditTrail(payload.signedDocumentExternalId),
        sanitizeFilenameWithSuffix(
          title || (await this.getDefaultFileName(petition.id, petition.recipient_locale)),
          "_audit_trail.pdf",
        ),
        integration.id,
      );

      await this.petitions.updatePetitionSignatures(signature.id, {
        file_upload_audit_trail_id: auditTrail.id,
      });
    } catch (error) {
      if (!(error instanceof InvalidCredentialsError)) {
        throw error;
      }
    }
  }

  async updateOrganizationBranding(payload: { orgId: number; integrationId: Maybe<number> }) {
    const signatureIntegrations = await this.integrations.loadIntegrationsByOrgId(
      payload.orgId,
      "SIGNATURE",
    );

    await pMap(
      signatureIntegrations,
      async (integration) => {
        // if targeting a single integration for update, make sure to skip every other
        if (isNonNullish(payload.integrationId) && integration.id !== payload.integrationId) {
          return;
        }

        const client = this.signatureClientFactory(integration.provider, integration.id);
        await client.onOrganizationBrandChange?.(payload.orgId);
      },
      { concurrency: 1 },
    );
  }

  async fetchOrgSignatureIntegration(orgIntegrationId: number): Promise<SignatureOrgIntegration> {
    const signatureIntegration = await this.integrations.loadIntegration(orgIntegrationId);

    if (!signatureIntegration || signatureIntegration.type !== "SIGNATURE") {
      throw new Error(
        `Couldn't find an enabled signature integration for OrgIntegration:${orgIntegrationId}`,
      );
    }

    return signatureIntegration as any;
  }

  async fetchPetition(id: number) {
    const petition = await this.petitions.loadPetition(id);
    if (!petition) {
      throw new Error(`Couldn't find petition with id ${id}`);
    }
    return petition;
  }

  async fetchPetitionSignature(petitionSignatureRequestId: number) {
    const signature = await this.petitions.loadPetitionSignatureById.raw(
      petitionSignatureRequestId,
    );
    if (!signature) {
      throw new Error(`Petition Signature Request with id ${petitionSignatureRequestId} not found`);
    }

    return signature;
  }

  private findSignerExternalId(
    documents: SignatureResponse["documents"],
    signer: PetitionSignatureConfigSigner,
    signerIndex: number,
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
            documents,
          )}, index: ${signerIndex} `,
        );
      }
      return externalId;
    } else if (signerByEmail.length === 0) {
      // if no signers were found with that email, there's an error
      throw new Error(
        `Can't find signer by email on document. signer:${JSON.stringify(
          signer,
        )}. documents: ${JSON.stringify(documents)}`,
      );
    }
  }

  async storeDocument(buffer: Buffer, filename: string, integrationId: number) {
    const path = random(16);
    const res = await this.storage.fileUploads.uploadFile(path, "application/pdf", buffer);

    const [file] = await this.files.createFileUpload(
      {
        content_type: "application/pdf",
        filename,
        path,
        size: res["ContentLength"]!.toString(),
        upload_complete: true,
      },
      this.config.instanceName,
    );
    return file;
  }

  async storeTemporaryDocument(filePath: string, filename: string) {
    const path = random(16);
    const buffer = await readFile(filePath);
    const res = await this.storage.temporaryFiles.uploadFile(path, "application/pdf", buffer);

    return await this.files.createTemporaryFile(
      {
        content_type: "application/pdf",
        filename,
        path,
        size: res["ContentLength"]!.toString(),
      },
      this.config.instanceName,
    );
  }

  async getDefaultFileName(petitionId: number, locale: ContactLocale) {
    return (
      (await this.petitions.getFirstDefinedTitleFromHeadings(petitionId)) ||
      (await this.i18n.getIntl(locale)).formatMessage({
        id: "generic.untitled",
        defaultMessage: "Untitled",
      })
    );
  }
}

createQueueWorker("signature-worker", SignatureWorker, {
  forkHandlers: true,
  async onForkError(signal, message: SignatureWorkerPayload, context) {
    if (message.type === "start-signature-process") {
      await context.petitions.updatePetitionSignatureRequestAsCancelled(
        message.payload.petitionSignatureRequestId,
        {
          cancel_reason: "REQUEST_ERROR",
          cancel_data: {
            error: "fork process error",
            error_code: signal,
          },
        },
      );
    }
  },
});
