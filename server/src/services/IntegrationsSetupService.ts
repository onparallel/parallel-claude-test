import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { CreateOrgIntegration } from "../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { AzureOpenAiIntegration } from "../integrations/ai-completion/AzureOpenAiIntegration";
import {
  BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  BankflipDocumentProcessingIntegration,
} from "../integrations/document-processing/bankflip/BankflipDocumentProcessingIntegration";
import { DowJonesIntegration } from "../integrations/dow-jones/DowJonesIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "../integrations/id-verification/bankflip/BankflipIdVerificationIntegration";
import {
  EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  EInformaProfileExternalSourceIntegration,
} from "../integrations/profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import {
  SignaturitEnvironment,
  SignaturitIntegration,
} from "../integrations/signature/SignaturitIntegration";
import { FETCH_SERVICE, IFetchService } from "./FetchService";

export const INTEGRATIONS_SETUP_SERVICE = Symbol.for("INTEGRATIONS_SETUP_SERVICE");
export interface IIntegrationsSetupService {
  createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    environment: SignaturitEnvironment | null,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"SIGNATURE", "SIGNATURIT">>;
  createDowJonesIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    credentials: Pick<
      IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">,
      "CLIENT_ID" | "USERNAME" | "PASSWORD"
    >,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOW_JONES_KYC", "DOW_JONES_KYC">>;
  createAzureOpenAiIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: IntegrationSettings<"AI_COMPLETION", "AZURE_OPEN_AI">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"AI_COMPLETION", "AZURE_OPEN_AI">>;
  createBankflipIdVerificationIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"ID_VERIFICATION", "BANKFLIP">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"ID_VERIFICATION", "BANKFLIP">>;
  createBankflipDocumentProcessingIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"DOCUMENT_PROCESSING", "BANKFLIP">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOCUMENT_PROCESSING", "BANKFLIP">>;
  createEInformaProfileExternalSourceIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "EINFORMA">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "EINFORMA">>;
}

@injectable()
export class IntegrationsSetupService implements IIntegrationsSetupService {
  constructor(
    @inject(FETCH_SERVICE) private fetch: IFetchService,
    @inject(SignaturitIntegration) private signaturitIntegration: SignaturitIntegration,
    @inject(DowJonesIntegration) private dowJonesIntegration: DowJonesIntegration,
    @inject(AzureOpenAiIntegration) private azureOpenAiIntegration: AzureOpenAiIntegration,
    @inject(BANKFLIP_ID_VERIFICATION_INTEGRATION)
    private bankflipIdVerificationIntegration: BankflipIdVerificationIntegration,
    @inject(BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION)
    private bankflipDocumentProcessingIntegration: BankflipDocumentProcessingIntegration,
    @inject(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    private eInformaProfileExternalSourceIntegration: EInformaProfileExternalSourceIntegration,
  ) {}

  async createSignaturitIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    apiKey: string,
    env: SignaturitEnvironment | null,
    isParallelManaged: boolean,
    createdBy: string,
    t?: Knex.Transaction,
  ) {
    let environment = env;
    if (!environment) {
      ({ environment } = await this.signaturitIntegration.authenticateApiKey(apiKey));
    }
    return await this.signaturitIntegration.createOrgIntegration(
      {
        ...data,
        settings: {
          CREDENTIALS: { API_KEY: apiKey },
          ENVIRONMENT: environment,
          IS_PARALLEL_MANAGED: isParallelManaged,
        },
      },
      createdBy,
      t,
    );
  }

  async createDowJonesIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default">,
    credentials: Pick<
      IntegrationCredentials<"DOW_JONES_KYC", "DOW_JONES_KYC">,
      "CLIENT_ID" | "USERNAME" | "PASSWORD"
    >,
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOW_JONES_KYC", "DOW_JONES_KYC">> {
    return await this.dowJonesIntegration.createDowJonesIntegration(
      data,
      credentials,
      createdBy,
      t,
    );
  }

  async createAzureOpenAiIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: IntegrationSettings<"AI_COMPLETION", "AZURE_OPEN_AI">;
    },
    createdBy: string,
    t?: Knex.Transaction<any, any[]> | undefined,
  ): Promise<EnhancedOrgIntegration<"AI_COMPLETION", "AZURE_OPEN_AI">> {
    return await this.azureOpenAiIntegration.createOrgIntegration(data, createdBy, t);
  }

  async createBankflipIdVerificationIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: { CREDENTIALS: { API_KEY: string; HOST: string; WEBHOOK_SECRET: string } };
    },
    createdBy: string,
    t?: Knex.Transaction<any, any[]> | undefined,
  ): Promise<EnhancedOrgIntegration<"ID_VERIFICATION", "BANKFLIP">> {
    return await this.bankflipIdVerificationIntegration.createOrgIntegration(data, createdBy, t);
  }

  async createBankflipDocumentProcessingIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"DOCUMENT_PROCESSING", "BANKFLIP">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"DOCUMENT_PROCESSING", "BANKFLIP">> {
    return await this.bankflipDocumentProcessingIntegration.createOrgIntegration(
      data,
      createdBy,
      t,
    );
  }

  async createEInformaProfileExternalSourceIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "EINFORMA">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "EINFORMA">> {
    // verify that credentials are valid
    await this.eInformaProfileExternalSourceIntegration.fetchAccessToken(data.settings.CREDENTIALS);

    return await this.eInformaProfileExternalSourceIntegration.createOrgIntegration(
      data,
      createdBy,
      t,
    );
  }
}
