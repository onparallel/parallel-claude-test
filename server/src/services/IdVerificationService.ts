import { inject, injectable } from "inversify";
import { assert } from "ts-essentials";
import { CONFIG, Config } from "../config";
import { ContactLocale } from "../db/__types";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { TaskRepository } from "../db/repositories/TaskRepository";
import {
  CreateIdentityVerificationSessionResponse,
  IIdVerificationIntegration,
  IdentityVerificationSessionRequestMetadata,
  IdentityVerificationSessionResponse,
  IdentityVerificationSessionSummaryResponse,
} from "../integrations/id-verification/IdVerificationIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "../integrations/id-verification/bankflip/BankflipIdVerificationIntegration";
import { fromGlobalId } from "../util/globalId";
import { never } from "../util/never";

export const ID_VERIFICATION_SERVICE = Symbol.for("ID_VERIFICATION_SERVICE");

type IdentityVerificationDocumentType =
  | "ID_CARD"
  | "PASSPORT"
  | "RESIDENCE_PERMIT"
  | "DRIVER_LICENSE";

interface IdentityVerificationSessionRequest {
  type: "SIMPLE" | "EXTENDED";
  allowedDocuments: IdentityVerificationDocumentType[];
}

interface IdVerificationSessionCompletedInput {
  externalId: string;
  integrationId: number;
}

export interface IIdVerificationService {
  fetchSession(
    integrationId: number,
    sessionId: string,
  ): Promise<IdentityVerificationSessionResponse>;
  fetchSessionSummary(
    integrationId: number,
    identityVerificationId: string,
  ): Promise<IdentityVerificationSessionSummaryResponse>;
  fetchBinaryDocumentContents(integrationId: number, documentId: string): Promise<Buffer>;
  createSession(
    request: IdentityVerificationSessionRequest,
    metadata: IdentityVerificationSessionRequestMetadata,
    locale: ContactLocale,
  ): Promise<CreateIdentityVerificationSessionResponse>;
  onSessionCompleted(input: IdVerificationSessionCompletedInput): Promise<void>;
}

@injectable()
export class IdVerificationService implements IIdVerificationService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(TaskRepository) private tasks: TaskRepository,
    @inject(CONFIG) private config: Config,
    @inject(BANKFLIP_ID_VERIFICATION_INTEGRATION)
    private bankflipIdVIntegration: BankflipIdVerificationIntegration,
  ) {}

  private async getIntegration(integrationId: number): Promise<IIdVerificationIntegration> {
    const orgIntegration = await this.integrations.loadIntegration(integrationId);

    assert(orgIntegration?.type === "ID_VERIFICATION", "ID_VERIFICATION integration not found");

    switch (orgIntegration.provider) {
      case "BANKFLIP":
        return this.bankflipIdVIntegration;
      default:
        never("Unknown provider");
    }
  }

  async fetchSession(
    integrationId: number,
    sessionId: string,
  ): Promise<IdentityVerificationSessionResponse> {
    const integration = await this.getIntegration(integrationId);
    return await integration.fetchSession(integrationId, sessionId);
  }

  async fetchSessionSummary(integrationId: number, identityVerificationId: string) {
    const integration = await this.getIntegration(integrationId);
    return await integration.fetchSessionSummary(integrationId, identityVerificationId);
  }

  async fetchBinaryDocumentContents(integrationId: number, documentId: string) {
    const integration = await this.getIntegration(integrationId);
    return await integration.fetchBinaryDocumentContents(integrationId, documentId);
  }

  async createSession(
    request: IdentityVerificationSessionRequest,
    metadata: IdentityVerificationSessionRequestMetadata,
    locale: ContactLocale,
  ) {
    const fieldId = fromGlobalId(metadata.fieldId, "PetitionField").id;
    const field = await this.petitions.loadField(fieldId);

    assert(
      field && field.type === "ID_VERIFICATION",
      "Field not found or not of type ID_VERIFICATION",
    );

    const idVerification = await this.getIntegration(
      fromGlobalId(metadata.integrationId, "OrgIntegration").id,
    );

    return await idVerification.createSession(metadata, request, locale);
  }

  async onSessionCompleted(input: IdVerificationSessionCompletedInput) {
    await this.tasks.createTask(
      {
        name: "ID_VERIFICATION_SESSION_COMPLETED",
        input: {
          external_id: input.externalId,
          integration_id: input.integrationId,
        },
      },
      this.config.instanceName,
    );
  }
}
