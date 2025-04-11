import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { CreateOrgIntegration, OrgIntegration } from "../db/__types";
import {
  EnhancedOrgIntegration,
  IntegrationCredentials,
  IntegrationSettings,
} from "../db/repositories/IntegrationRepository";
import { AnthropicIntegration } from "../integrations/ai-completion/AnthropicIntegration";
import { AzureOpenAiIntegration } from "../integrations/ai-completion/AzureOpenAiIntegration";
import {
  BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  BankflipDocumentProcessingIntegration,
} from "../integrations/document-processing/bankflip/BankflipDocumentProcessingIntegration";
import { DowJonesIntegration } from "../integrations/dow-jones/DowJonesIntegration";
import {
  IMANAGE_FILE_EXPORT_INTEGRATION,
  IManageFileExportIntegration,
} from "../integrations/file-export/imanage/IManageFileExportIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "../integrations/id-verification/bankflip/BankflipIdVerificationIntegration";
import {
  COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  CompaniesHouseProfileExternalSourceIntegration,
} from "../integrations/profile-external-source/companies-house/CompaniesHouseProfileExternalSourceIntegration";
import {
  EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  EInformaProfileExternalSourceIntegration,
} from "../integrations/profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import {
  SignaturitEnvironment,
  SignaturitIntegration,
} from "../integrations/signature/SignaturitIntegration";
import { Replace } from "../util/types";

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
  createAnthropicIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: IntegrationSettings<"AI_COMPLETION", "ANTHROPIC">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"AI_COMPLETION", "ANTHROPIC">>;
  updateAnthropicIntegration(
    integrationId: number,
    data: Replace<
      Partial<OrgIntegration>,
      { settings: IntegrationSettings<"AI_COMPLETION", "ANTHROPIC"> }
    >,
    t?: Knex.Transaction,
  ): Promise<void>;
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
  updateEInformaProfileExternalSourceIntegration(
    integrationId: number,
    data: Replace<
      Partial<OrgIntegration>,
      { settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "EINFORMA"> }
    >,
    t?: Knex.Transaction,
  ): Promise<void>;
  createIManageFileExportIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"FILE_EXPORT", "IMANAGE">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"FILE_EXPORT", "IMANAGE">>;
  createCompaniesHouseProfileExternalSourceIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE">>;
  updateCompaniesHouseProfileExternalSourceIntegration(
    integrationId: number,
    data: Replace<
      Partial<OrgIntegration>,
      { settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE"> }
    >,
    t?: Knex.Transaction,
  ): Promise<void>;
}

@injectable()
export class IntegrationsSetupService implements IIntegrationsSetupService {
  constructor(
    @inject(SignaturitIntegration) private signaturitIntegration: SignaturitIntegration,
    @inject(DowJonesIntegration) private dowJonesIntegration: DowJonesIntegration,
    @inject(AzureOpenAiIntegration) private azureOpenAiIntegration: AzureOpenAiIntegration,
    @inject(AnthropicIntegration)
    private anthropicIntegration: AnthropicIntegration,
    @inject(BANKFLIP_ID_VERIFICATION_INTEGRATION)
    private bankflipIdVerificationIntegration: BankflipIdVerificationIntegration,
    @inject(BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION)
    private bankflipDocumentProcessingIntegration: BankflipDocumentProcessingIntegration,
    @inject(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    private eInformaProfileExternalSourceIntegration: EInformaProfileExternalSourceIntegration,
    @inject(COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    private companiesHouseProfileExternalSourceIntegration: CompaniesHouseProfileExternalSourceIntegration,
    @inject(IMANAGE_FILE_EXPORT_INTEGRATION)
    private iManageFileExportIntegration: IManageFileExportIntegration,
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

  async createAnthropicIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "is_default" | "name"> & {
      settings: IntegrationSettings<"AI_COMPLETION", "ANTHROPIC">;
    },
    createdBy: string,
    t?: Knex.Transaction<any, any[]> | undefined,
  ): Promise<EnhancedOrgIntegration<"AI_COMPLETION", "ANTHROPIC">> {
    return await this.anthropicIntegration.createOrgIntegration(data, createdBy, t);
  }

  async updateAnthropicIntegration(
    integrationId: number,
    data: Replace<
      Partial<OrgIntegration>,
      { settings: IntegrationSettings<"AI_COMPLETION", "ANTHROPIC"> }
    >,
    t?: Knex.Transaction<any, any[]> | undefined,
  ): Promise<void> {
    await this.anthropicIntegration.updateOrgIntegration(integrationId, data, t);
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

  async updateEInformaProfileExternalSourceIntegration(
    integrationId: number,
    data: Replace<
      Partial<OrgIntegration>,
      { settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "EINFORMA"> }
    >,
    t?: Knex.Transaction,
  ): Promise<void> {
    // verify that credentials are valid
    await this.eInformaProfileExternalSourceIntegration.fetchAccessToken(data.settings.CREDENTIALS);

    await this.eInformaProfileExternalSourceIntegration.updateOrgIntegration(
      integrationId,
      data,
      t,
    );
  }

  async createIManageFileExportIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"FILE_EXPORT", "IMANAGE">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"FILE_EXPORT", "IMANAGE">> {
    return await this.iManageFileExportIntegration.createOrgIntegration(data, createdBy, t);
  }

  async createCompaniesHouseProfileExternalSourceIntegration(
    data: Pick<CreateOrgIntegration, "org_id" | "name" | "is_default"> & {
      settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE">;
    },
    createdBy: string,
    t?: Knex.Transaction,
  ): Promise<EnhancedOrgIntegration<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE">> {
    await this.companiesHouseProfileExternalSourceIntegration.testApiKey(
      data.settings.CREDENTIALS.API_KEY,
    );
    return await this.companiesHouseProfileExternalSourceIntegration.createOrgIntegration(
      data,
      createdBy,
      t,
    );
  }

  async updateCompaniesHouseProfileExternalSourceIntegration(
    integrationId: number,
    data: Replace<
      Partial<OrgIntegration>,
      { settings: IntegrationSettings<"PROFILE_EXTERNAL_SOURCE", "COMPANIES_HOUSE"> }
    >,
    t?: Knex.Transaction,
  ): Promise<void> {
    await this.companiesHouseProfileExternalSourceIntegration.testApiKey(
      data.settings.CREDENTIALS.API_KEY,
    );
    await this.companiesHouseProfileExternalSourceIntegration.updateOrgIntegration(
      integrationId,
      data,
      t,
    );
  }
}
