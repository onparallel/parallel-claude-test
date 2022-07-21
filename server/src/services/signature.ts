import { inject, injectable } from "inversify";
import { Knex } from "knex";
import "reflect-metadata";
import { countBy, isDefined, omit } from "remeda";
import { CONFIG, Config } from "../config";
import {
  IntegrationRepository,
  IntegrationSettings,
  SignatureProvider,
} from "../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import {
  PetitionRepository,
  PetitionSignatureConfig,
  PetitionSignatureConfigSigner,
} from "../db/repositories/PetitionRepository";
import {
  OrgIntegration,
  PetitionAccess,
  PetitionSignatureRequest,
  Tone,
  User,
} from "../db/__types";
import { unMaybeArray } from "../util/arrays";
import { toGlobalId } from "../util/globalId";
import { random } from "../util/token";
import { MaybeArray } from "../util/types";
import { AWS_SERVICE, IAws } from "./aws";
import { FETCH_SERVICE, IFetchService } from "./fetch";
import { I18N_SERVICE, II18nService } from "./i18n";
import { BrandingIdKey, ISignatureClient } from "./signature-clients/client";
import { SignaturItClient } from "./signature-clients/signaturit";

export interface ISignatureService {
  getClient(integration: OrgIntegration): ISignatureClient;
  validateCredentials(provider: SignatureProvider, credentials: any): Promise<any>;
  createSignatureRequest(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
    starter: User | PetitionAccess,
    t?: Knex.Transaction
  ): Promise<any>;
  cancelSignatureRequest(
    signatures: MaybeArray<PetitionSignatureRequest>,
    t?: Knex.Transaction
  ): Promise<void>;
  sendSignatureReminders(signatures: MaybeArray<PetitionSignatureRequest>): Promise<void>;
  storeSignedDocument(
    signature: PetitionSignatureRequest,
    signedDocumentExternalId: string,
    signer: PetitionSignatureConfigSigner
  ): Promise<void>;
  storeAuditTrail(
    signature: PetitionSignatureRequest,
    signedDocumentExternalId: string
  ): Promise<void>;
  updateBranding(orgId: number, t?: Knex.Transaction): Promise<void>;
}

export const SIGNATURE = Symbol.for("SIGNATURE");
@injectable()
export class SignatureService implements ISignatureService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(IntegrationRepository)
    private integrationRepository: IntegrationRepository,
    @inject(PetitionRepository) private petitionsRepository: PetitionRepository,
    @inject(OrganizationRepository) private organizationsRepository: OrganizationRepository,
    @inject(AWS_SERVICE) private aws: IAws,
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService
  ) {}

  public getClient(integration: OrgIntegration): ISignatureClient {
    switch (integration.provider.toUpperCase()) {
      case "SIGNATURIT":
        return this.buildSignaturItClient(integration);
      default:
        throw new Error(`Couldn't resolve signature client: ${integration.provider}`);
    }
  }

  /**
   * runs validations on signature provider to make sure credentials are valid.
   * @returns optional object with extra data for later configuration of the integration
   */
  async validateCredentials(provider: SignatureProvider, credentials: any) {
    if (provider === "SIGNATURIT" && isDefined(credentials.API_KEY)) {
      const environment = await SignaturItClient.guessEnvironment(credentials.API_KEY, this.fetch);
      return { environment };
    }
  }

  private buildSignaturItClient(integration: OrgIntegration): SignaturItClient {
    const settings = integration.settings as IntegrationSettings<"SIGNATURE", "SIGNATURIT">;
    const client = new SignaturItClient(settings, this.config, this.i18n);
    client.on(
      "branding_created",
      ({ locale, brandingId, tone }: { locale: string; brandingId: string; tone: Tone }) => {
        const key = `${locale.toUpperCase()}_${tone.toUpperCase()}_BRANDING_ID` as BrandingIdKey;

        settings[key] = brandingId;

        this.integrationRepository.updateOrgIntegration<"SIGNATURE">(
          integration.id,
          { settings },
          `OrgIntegration:${integration.id}`
        );
      }
    );
    return client;
  }

  async createSignatureRequest(
    petitionId: number,
    signatureConfig: PetitionSignatureConfig,
    starter: User | PetitionAccess,
    t?: Knex.Transaction
  ) {
    await this.verifySignatureIntegration(petitionId, signatureConfig.orgIntegrationId);

    const isAccess = "keycode" in starter;
    const updatedBy = isAccess ? `Contact:${starter.contact_id}` : `User:${starter.id}`;

    let updatedPetition = null;

    const allSigners = [
      ...signatureConfig.signersInfo,
      ...(signatureConfig.additionalSignersInfo ?? []),
    ];

    const emails = allSigners.map((s) => s.email);
    if (process.env.NODE_ENV === "development") {
      if (!emails.every((email) => this.config.development.whitelistedEmails.includes(email))) {
        throw new Error(
          "DEVELOPMENT: Every recipient email must be whitelisted in .development.env"
        );
      }
    }

    if (allSigners.length === 0) {
      throw new Error(`REQUIRED_SIGNER_INFO_ERROR`);
    }

    if ((signatureConfig.additionalSignersInfo ?? [])?.length > 0) {
      [updatedPetition] = await this.petitionsRepository.updatePetition(
        petitionId,
        { signature_config: signatureConfig },
        updatedBy,
        t
      );
    }

    const previousSignatureRequests =
      await this.petitionsRepository.loadPetitionSignaturesByPetitionId(petitionId, {
        refresh: true,
      });

    // avoid recipients restarting the signature process too many times
    if (countBy(previousSignatureRequests, (r) => r.cancel_reason === "REQUEST_RESTARTED") >= 20) {
      throw new Error(`Signature request on Petition:${petitionId} was restarted too many times`);
    }

    const enqueuedSignatureRequest = previousSignatureRequests.find(
      (r) => r.status === "ENQUEUED" || r.status === "PROCESSING"
    );

    const pendingSignatureRequest = previousSignatureRequests.find((r) => r.status === "PROCESSED");

    // cancel pending signature request before starting a new one
    if (enqueuedSignatureRequest || pendingSignatureRequest) {
      await Promise.all([
        this.petitionsRepository.cancelPetitionSignatureRequest(
          [enqueuedSignatureRequest, pendingSignatureRequest].filter(isDefined),
          "REQUEST_RESTARTED",
          isAccess ? { petition_access_id: starter.id } : { user_id: starter.id },
          undefined,
          t
        ),
        this.petitionsRepository.loadPetitionSignaturesByPetitionId.dataloader.clear(petitionId),
        pendingSignatureRequest
          ? // only send a cancel request if the signature request has been already processed
            this.aws.enqueueMessages(
              "signature-worker",
              {
                groupId: `signature-${toGlobalId("Petition", pendingSignatureRequest.petition_id)}`,
                body: {
                  type: "cancel-signature-process",
                  payload: { petitionSignatureRequestId: pendingSignatureRequest.id },
                },
              },
              t
            )
          : null,
      ]);
    }

    const signatureRequest = await this.petitionsRepository.createPetitionSignature(
      petitionId,
      {
        signature_config: {
          ...(omit(signatureConfig, ["additionalSignersInfo"]) as any),
          signersInfo: signatureConfig.signersInfo.concat(
            signatureConfig.additionalSignersInfo ?? []
          ),
        },
      },
      t
    );

    await Promise.all([
      this.aws.enqueueMessages(
        "signature-worker",
        {
          groupId: `signature-${toGlobalId("Petition", petitionId)}`,
          body: {
            type: "start-signature-process",
            payload: { petitionSignatureRequestId: signatureRequest.id },
          },
        },
        t
      ),
      this.petitionsRepository.createEvent(
        {
          type: "SIGNATURE_STARTED",
          petition_id: petitionId,
          data: {
            petition_signature_request_id: signatureRequest.id,
          },
        },
        t
      ),
    ]);

    return { petition: updatedPetition, signatureRequest };
  }

  async storeSignedDocument(
    signature: PetitionSignatureRequest,
    signedDocumentExternalId: string,
    signer: PetitionSignatureConfigSigner
  ) {
    await this.aws.enqueueMessages("signature-worker", {
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
    await this.aws.enqueueMessages("signature-worker", {
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

  async cancelSignatureRequest(
    signature: MaybeArray<PetitionSignatureRequest>,
    t?: Knex.Transaction
  ): Promise<void> {
    const signatures = unMaybeArray(signature).filter((s) => s.status === "PROCESSED");
    if (signatures.length > 0) {
      await this.aws.enqueueMessages(
        "signature-worker",
        signatures.map((s) => ({
          id: `signature-${toGlobalId("Petition", s.petition_id)}`,
          groupId: `signature-${toGlobalId("Petition", s.petition_id)}`,
          body: {
            type: "cancel-signature-process",
            payload: { petitionSignatureRequestId: s.id },
          },
        })),
        t
      );
    }
  }

  async sendSignatureReminders(signature: MaybeArray<PetitionSignatureRequest>): Promise<void> {
    const signatures = unMaybeArray(signature).filter((s) => s.status === "PROCESSED");
    if (signatures.length > 0) {
      await this.aws.enqueueMessages(
        "signature-worker",
        signatures.map((s) => ({
          id: `signature-${toGlobalId("Petition", s.petition_id)}`,
          groupId: `signature-${toGlobalId("Petition", s.petition_id)}`,
          body: {
            type: "send-signature-reminder",
            payload: { petitionSignatureRequestId: s.id },
          },
        }))
      );
    }
  }

  async updateBranding(orgId: number, t?: Knex.Transaction): Promise<void> {
    await this.aws.enqueueMessages(
      "signature-worker",
      {
        groupId: `signature-branding-${toGlobalId("Organization", orgId)}`,
        body: {
          type: "update-branding",
          payload: {
            orgId,
            _: random(10), // random value on message body to override sqs contentBasedDeduplication and allow processing repeated messages in short periods of time
          },
        },
      },
      t
    );
  }

  /**
   *
   * checks that the signature integration exists and is valid.
   * also checks the usage limit if the integration uses our shared sandbox API_KEY
   */
  private async verifySignatureIntegration(
    petitionId: number,
    orgIntegrationId: number | undefined
  ) {
    if (orgIntegrationId === undefined) {
      throw new Error(`undefined orgIntegrationId on signature_config. Petition:${petitionId}`);
    }
    const petition = await this.petitionsRepository.loadPetition(petitionId);
    if (!petition) {
      throw new Error(`Petition:${petitionId} not found`);
    }

    const integration = await this.integrationRepository.loadIntegration(orgIntegrationId);
    if (!integration || integration.type !== "SIGNATURE") {
      throw new Error(
        `Couldn't find an enabled signature integration for OrgIntegration:${orgIntegrationId}`
      );
    }

    if (petition.org_id !== integration.org_id) {
      throw new Error(`Invalid OrgIntegration:${integration.id} on Petition:${petitionId}`);
    }

    if (integration.provider.toUpperCase() === "SIGNATURIT") {
      const settings = integration.settings as IntegrationSettings<"SIGNATURE", "SIGNATURIT">;
      if (settings.CREDENTIALS.API_KEY === this.config.signature.signaturitSharedProductionApiKey) {
        const sharedKeyUsage = await this.organizationsRepository.getOrganizationCurrentUsageLimit(
          integration.org_id,
          "SIGNATURIT_SHARED_APIKEY"
        );
        if (!sharedKeyUsage || sharedKeyUsage.used >= sharedKeyUsage.limit) {
          throw new Error("SIGNATURIT_SHARED_APIKEY_LIMIT_REACHED");
        }
      }
    }
  }
}
