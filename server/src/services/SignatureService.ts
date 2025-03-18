import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { countBy, isNonNullish, isNullish, omit } from "remeda";
import { CONFIG, Config } from "../config";
import {
  PetitionAccess,
  PetitionSignatureCancelReason,
  PetitionSignatureRequest,
  User,
} from "../db/__types";
import { FileRepository } from "../db/repositories/FileRepository";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import {
  PetitionRepository,
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
  PetitionSignatureRequestCancelData,
} from "../db/repositories/PetitionRepository";
import { toGlobalId } from "../util/globalId";
import { random } from "../util/token";
import { MaybeArray, unMaybeArray } from "../util/types";
import { IQueuesService, QUEUES_SERVICE } from "./QueuesService";
import { IStorageService, STORAGE_SERVICE } from "./StorageService";

interface UpdateBrandingOpts {
  integrationId?: number;
}
export interface ISignatureService {
  createSignatureRequest(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
    starter: User | PetitionAccess,
  ): Promise<any>;
  cancelSignatureRequest<CancelReason extends PetitionSignatureCancelReason>(
    signatures: MaybeArray<PetitionSignatureRequest>,
    cancelReason: CancelReason,
    cancelData: PetitionSignatureRequestCancelData<CancelReason>,
    extraData?: Partial<PetitionSignatureRequest>,
    t?: Knex.Transaction,
  ): Promise<PetitionSignatureRequest[]>;
  sendSignatureReminders(
    signatures: MaybeArray<PetitionSignatureRequest>,
    userId: number,
  ): Promise<void>;
  storeSignedDocument(
    signature: PetitionSignatureRequest,
    signedDocumentExternalId: string,
    signer: PetitionSignatureConfigSigner,
  ): Promise<void>;
  storeAuditTrail(
    signature: PetitionSignatureRequest,
    signedDocumentExternalId: string,
  ): Promise<void>;
  onOrganizationBrandChange(orgId: number, opts?: UpdateBrandingOpts): Promise<void>;
}

export const SIGNATURE = Symbol.for("SIGNATURE");
@injectable()
export class SignatureService implements ISignatureService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(IntegrationRepository)
    private integrations: IntegrationRepository,
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(QUEUES_SERVICE) private queues: IQueuesService,
    @inject(FileRepository) private files: FileRepository,
    @inject(STORAGE_SERVICE) private storage: IStorageService,
  ) {}

  async createSignatureRequest(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
    starter: User | PetitionAccess,
  ) {
    await this.verifySignatureConfig(petitionId, signatureConfig);

    const isAccess = "keycode" in starter;
    const updatedBy = isAccess ? `Contact:${starter.contact_id}` : `User:${starter.id}`;

    const [updatedPetition] = await this.petitions.updatePetition(
      petitionId,
      { signature_config: omit(signatureConfig, ["customDocumentTemporaryFileId"]) },
      updatedBy,
    );

    await this.cancelPendingSignatureRequests(petitionId, starter);

    const sanitizedSigners = (signatureConfig.additionalSignersInfo ?? [])
      .concat(signatureConfig.signersInfo)
      .map((s) => ({
        ...s,
        email: s.email.replace(
          // Remove control characters, zero-width spaces, direction markers, and other invisible formatting characters
          /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00AD]/g,
          "",
        ),
      }));

    const signatureRequest = await this.petitions.createPetitionSignature(petitionId, {
      signature_config: {
        ...omit(signatureConfig, ["additionalSignersInfo", "isEnabled"]),
        signersInfo: sanitizedSigners,
      },
    });

    await this.queues.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", petitionId)}`,
      body: {
        type: "start-signature-process",
        payload: { petitionSignatureRequestId: signatureRequest.id },
      },
    });

    return { petition: updatedPetition, signatureRequest };
  }

  async storeSignedDocument(
    signature: PetitionSignatureRequest,
    signedDocumentExternalId: string,
    signer: PetitionSignatureConfigSigner,
  ) {
    await this.queues.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", signature.petition_id)}`,
      body: {
        type: "store-signed-document",
        payload: {
          petitionSignatureRequestId: signature.id,
          signedDocumentExternalId,
          signer,
        },
      },
    });
  }

  async storeAuditTrail(signature: PetitionSignatureRequest, signedDocumentExternalId: string) {
    await this.queues.enqueueMessages("signature-worker", {
      groupId: `signature-${toGlobalId("Petition", signature.petition_id)}`,
      body: {
        type: "store-audit-trail",
        payload: {
          petitionSignatureRequestId: signature.id,
          signedDocumentExternalId,
        },
      },
    });
  }

  async cancelSignatureRequest<CancelReason extends PetitionSignatureCancelReason>(
    signature: MaybeArray<PetitionSignatureRequest>,
    cancelReason: CancelReason,
    cancelData: PetitionSignatureRequestCancelData<CancelReason>,
    extraData?: Partial<PetitionSignatureRequest>,
    t?: Knex.Transaction,
  ) {
    const signatures = unMaybeArray(signature).filter((s) => s.status === "PROCESSED");

    const rows = await this.petitions.updatePetitionSignatures(
      signatures.map((s) => s.id),
      {
        status: "CANCELLING",
        cancel_reason: cancelReason,
        cancel_data: cancelData,
        ...extraData,
      },
      t,
    );

    if (rows.length > 0) {
      await this.queues.enqueueMessages(
        "signature-worker",
        rows.map((s) => ({
          id: `signature-${toGlobalId("Petition", s.petition_id)}`,
          groupId: `signature-${toGlobalId("Petition", s.petition_id)}`,
          body: {
            type: "cancel-signature-process" as const,
            payload: { petitionSignatureRequestId: s.id },
          },
        })),
        t,
      );
    }

    return rows;
  }

  async sendSignatureReminders(signature: MaybeArray<PetitionSignatureRequest>, userId: number) {
    const signatures = unMaybeArray(signature).filter((s) => s.status === "PROCESSED");
    if (signatures.length > 0) {
      await this.queues.enqueueMessages(
        "signature-worker",
        signatures.map((s) => ({
          id: `signature-${toGlobalId("Petition", s.petition_id)}`,
          groupId: `signature-${toGlobalId("Petition", s.petition_id)}`,
          body: {
            type: "send-signature-reminder" as const,
            payload: { petitionSignatureRequestId: s.id, userId },
          },
        })),
      );
    }
  }

  async onOrganizationBrandChange(orgId: number, opts?: UpdateBrandingOpts) {
    await this.queues.enqueueMessages("signature-worker", {
      groupId: `signature-branding-${toGlobalId("Organization", orgId)}`,
      // add deduplication since payload is going to be the same when changing more than once.
      deduplicationId: random(10),
      body: {
        type: "update-branding",
        payload: {
          orgId,
          integrationId: opts?.integrationId ?? null,
        },
      },
    });
  }

  private async cancelPendingSignatureRequests(
    petitionId: number,
    canceller: PetitionAccess | User,
  ) {
    const isAccess = "keycode" in canceller;
    const previousSignatureRequests = await this.petitions.loadPetitionSignaturesByPetitionId(
      petitionId,
      {
        refresh: true,
      },
    );

    // avoid recipients restarting the signature process too many times
    if (countBy(previousSignatureRequests, (r) => r.cancel_reason === "REQUEST_RESTARTED") >= 20) {
      throw new Error(`Signature request on Petition:${petitionId} was restarted too many times`);
    }

    const enqueuedSignatureRequest = previousSignatureRequests.find(
      (r) => r.status === "ENQUEUED" || r.status === "PROCESSING",
    );

    const pendingSignatureRequest = previousSignatureRequests.find((r) => r.status === "PROCESSED");

    // cancel pending signature request before starting a new one
    if (enqueuedSignatureRequest) {
      await this.petitions.updatePetitionSignatureRequestAsCancelled(enqueuedSignatureRequest.id, {
        cancel_reason: "REQUEST_RESTARTED",
        cancel_data: isAccess ? { petition_access_id: canceller.id } : { user_id: canceller.id },
      });
    }

    // only send a cancel request if the signature request has been already processed
    if (pendingSignatureRequest) {
      await this.cancelSignatureRequest(
        pendingSignatureRequest,
        "REQUEST_RESTARTED",
        isAccess ? { petition_access_id: canceller.id } : { user_id: canceller.id },
      );
    }

    this.petitions.loadPetitionSignaturesByPetitionId.dataloader.clear(petitionId);
  }

  /**
   *
   * checks that the signature integration exists and is valid.
   * also checks the usage limit if the integration uses our shared sandbox API_KEY
   */
  private async verifySignatureConfig(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
  ) {
    if (signatureConfig.orgIntegrationId === undefined) {
      throw new Error(`undefined orgIntegrationId on signature_config`);
    }
    const petition = await this.petitions.loadPetition(petitionId);
    if (!petition) {
      throw new Error(`Petition not found`);
    }

    const integration = await this.integrations.loadIntegration(signatureConfig.orgIntegrationId);
    if (!integration || integration.type !== "SIGNATURE") {
      throw new Error(`Couldn't find an enabled signature integration`);
    }

    if (petition.org_id !== integration.org_id) {
      throw new Error(`Invalid integration`);
    }

    const allSigners = [
      ...signatureConfig.signersInfo,
      ...(signatureConfig.additionalSignersInfo ?? []),
    ];

    if (allSigners.length === 0) {
      throw new Error(`REQUIRED_SIGNER_INFO_ERROR`);
    }

    if (process.env.NODE_ENV === "development") {
      if (
        !allSigners.every((s) =>
          this.config.development.whitelistedEmails.some((e) => {
            const [l, d] = e.split("@");
            const [local, domain] = s.email.split("@");
            return d === domain && (l === local || local.startsWith(l + "+"));
          }),
        )
      ) {
        throw new Error(
          "DEVELOPMENT: Every recipient email must be whitelisted in .development.env",
        );
      }
    }

    if (
      signatureConfig.useCustomDocument &&
      isNullish(signatureConfig.customDocumentTemporaryFileId)
    ) {
      throw new Error("Custom document for signature not provided");
    }

    if (isNonNullish(signatureConfig.customDocumentTemporaryFileId)) {
      const file = await this.files.loadTemporaryFile(
        signatureConfig.customDocumentTemporaryFileId,
      );

      if (!file) {
        throw new Error("Temporary file not found for custom signature document");
      }
      try {
        await this.storage.temporaryFiles.getFileMetadata(file.path);
      } catch {
        throw new Error(
          "Some error happened when trying to fetch custom document metadata from S3",
        );
      }
    }
  }
}
