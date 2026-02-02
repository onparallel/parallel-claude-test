import { ContainerModule } from "inversify";
import {
  AI_COMPLETION_CLIENT,
  AI_COMPLETION_CLIENT_FACTORY,
  AiCompletionClientFactory,
  getAiCompletionClientFactory,
} from "./ai-completion/AiCompletionClient";
import { AnthropicClient } from "./ai-completion/AnthropicClient";
import { AnthropicIntegration } from "./ai-completion/AnthropicIntegration";
import { AwsBedrockClient } from "./ai-completion/AwsBedrockClient";
import { AwsBedrockIntegration } from "./ai-completion/AwsBedrockIntegration";
import { AzureOpenAiClient } from "./ai-completion/AzureOpenAIClient";
import { AzureOpenAiIntegration } from "./ai-completion/AzureOpenAiIntegration";
import {
  BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  BankflipDocumentProcessingIntegration,
} from "./document-processing/bankflip/BankflipDocumentProcessingIntegration";
import { DOW_JONES_CLIENT, DowJonesClient } from "./dow-jones/DowJonesClient";
import { DowJonesIntegration } from "./dow-jones/DowJonesIntegration";
import {
  IMANAGE_FILE_EXPORT_INTEGRATION,
  IManageFileExportIntegration,
} from "./file-export/imanage/IManageFileExportIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "./id-verification/bankflip/BankflipIdVerificationIntegration";
import {
  COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  CompaniesHouseProfileExternalSourceIntegration,
} from "./profile-external-source/companies-house/CompaniesHouseProfileExternalSourceIntegration";
import {
  EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  EInformaProfileExternalSourceIntegration,
} from "./profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import {
  getSapOdataClientFactory,
  SAP_ODATA_CLIENT,
  SAP_ODATA_CLIENT_FACTORY,
  SapOdataClient,
  SapOdataClientFactory,
} from "./profile-sync/sap/SapOdataClient";
import {
  getSapProfileSyncIntegrationFactory,
  SAP_PROFILE_SYNC_INTEGRATION,
  SAP_PROFILE_SYNC_INTEGRATION_FACTORY,
  SapProfileSyncIntegration,
  SapProfileSyncIntegrationFactory,
} from "./profile-sync/sap/SapProfileSyncIntegration";
import {
  PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR,
  SapProfileSyncIntegrationSettingsValidator,
} from "./profile-sync/sap/SapProfileSyncIntegrationSettingsValidator";
import { DocusignClient } from "./signature/DocusignClient";
import { DocusignIntegration } from "./signature/DocusignIntegration";
import {
  getSignatureClientFactory,
  SIGNATURE_CLIENT,
  SIGNATURE_CLIENT_FACTORY,
  SignatureClientFactory,
} from "./signature/SignatureClient";
import { SignaturitClient } from "./signature/SignaturitClient";
import { SignaturitIntegration } from "./signature/SignaturitIntegration";

export const integrationsModule = new ContainerModule((options) => {
  // AI COMPLETION
  options.bind(AI_COMPLETION_CLIENT).to(AzureOpenAiClient).whenNamed("AZURE_OPEN_AI");
  options.bind(AI_COMPLETION_CLIENT).to(AnthropicClient).whenNamed("ANTHROPIC");
  options.bind(AI_COMPLETION_CLIENT).to(AwsBedrockClient).whenNamed("AWS_BEDROCK");
  options.bind(AzureOpenAiIntegration).toSelf();
  options.bind(AnthropicIntegration).toSelf();
  options.bind(AwsBedrockIntegration).toSelf();
  options
    .bind<AiCompletionClientFactory>(AI_COMPLETION_CLIENT_FACTORY)
    .toFactory(getAiCompletionClientFactory);

  // SIGNATURE
  options.bind(SIGNATURE_CLIENT).to(SignaturitClient).whenNamed("SIGNATURIT");
  options.bind(SIGNATURE_CLIENT).to(DocusignClient).whenNamed("DOCUSIGN");
  options.bind(SignaturitIntegration).toSelf();
  options.bind(DocusignIntegration).toSelf();
  options
    .bind<SignatureClientFactory>(SIGNATURE_CLIENT_FACTORY)
    .toFactory(getSignatureClientFactory);

  // DOW JONES
  options.bind(DOW_JONES_CLIENT).to(DowJonesClient);
  options.bind(DowJonesIntegration).toSelf();

  // ID VERIFICATION
  options.bind(BANKFLIP_ID_VERIFICATION_INTEGRATION).to(BankflipIdVerificationIntegration);

  // DOCUMENT PROCESSING
  options.bind(BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION).to(BankflipDocumentProcessingIntegration);

  // PROFILE EXTERNAL SOURCES
  options
    .bind(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    .to(EInformaProfileExternalSourceIntegration);
  options
    .bind(COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    .to(CompaniesHouseProfileExternalSourceIntegration);

  // FILE EXPORT
  options.bind(IMANAGE_FILE_EXPORT_INTEGRATION).to(IManageFileExportIntegration);

  // PROFILE SYNC
  options.bind(SAP_ODATA_CLIENT).to(SapOdataClient);
  options.bind<SapOdataClientFactory>(SAP_ODATA_CLIENT_FACTORY).toFactory(getSapOdataClientFactory);
  options.bind(SAP_PROFILE_SYNC_INTEGRATION).to(SapProfileSyncIntegration);
  options
    .bind<SapProfileSyncIntegrationFactory>(SAP_PROFILE_SYNC_INTEGRATION_FACTORY)
    .toFactory(getSapProfileSyncIntegrationFactory);
  options
    .bind(PROFILE_SYNC_INTEGRATION_SETTINGS_VALIDATOR)
    .to(SapProfileSyncIntegrationSettingsValidator);
});
