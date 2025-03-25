import { ContainerModule } from "inversify";
import { AI_COMPLETION_CLIENT, IAiCompletionClient } from "./ai-completion/AiCompletionClient";
import { AzureOpenAiClient } from "./ai-completion/AzureOpenAIClient";
import { AzureOpenAiIntegration } from "./ai-completion/AzureOpenAiIntegration";
import { IDocumentProcessingIntegration } from "./document-processing/DocumentProcessingIntegration";
import {
  BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION,
  BankflipDocumentProcessingIntegration,
} from "./document-processing/bankflip/BankflipDocumentProcessingIntegration";
import { DOW_JONES_CLIENT, DowJonesClient, IDowJonesClient } from "./dow-jones/DowJonesClient";
import { DowJonesIntegration } from "./dow-jones/DowJonesIntegration";
import { IFileExportIntegration } from "./file-export/FileExportIntegration";
import {
  IMANAGE_FILE_EXPORT_INTEGRATION,
  IManageFileExportIntegration,
} from "./file-export/imanage/IManageFileExportIntegration";
import { IIdVerificationIntegration } from "./id-verification/IdVerificationIntegration";
import {
  BANKFLIP_ID_VERIFICATION_INTEGRATION,
  BankflipIdVerificationIntegration,
} from "./id-verification/bankflip/BankflipIdVerificationIntegration";
import { IProfileExternalSourceIntegration } from "./profile-external-source/ProfileExternalSourceIntegration";
import {
  COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  CompaniesHouseProfileExternalSourceIntegration,
} from "./profile-external-source/companies-house/CompaniesHouseProfileExternalSourceIntegration";
import {
  EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION,
  EInformaProfileExternalSourceIntegration,
} from "./profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import { DocusignClient } from "./signature/DocusignClient";
import { DocusignIntegration } from "./signature/DocusignIntegration";
import {
  getSignatureClientFactory,
  ISignatureClient,
  SIGNATURE_CLIENT,
  SIGNATURE_CLIENT_FACTORY,
  SignatureClientFactory,
} from "./signature/SignatureClient";
import { SignaturitClient } from "./signature/SignaturitClient";
import { SignaturitIntegration } from "./signature/SignaturitIntegration";

export const integrationsModule = new ContainerModule((options) => {
  options
    .bind<IAiCompletionClient<any>>(AI_COMPLETION_CLIENT)
    .to(AzureOpenAiClient)
    .whenNamed("AZURE_OPEN_AI");

  options.bind<AzureOpenAiIntegration>(AzureOpenAiIntegration).toSelf();

  options.bind<SignaturitIntegration>(SignaturitIntegration).toSelf();
  options.bind<DocusignIntegration>(DocusignIntegration).toSelf();
  options.bind<ISignatureClient>(SIGNATURE_CLIENT).to(SignaturitClient).whenNamed("SIGNATURIT");
  options.bind<ISignatureClient>(SIGNATURE_CLIENT).to(DocusignClient).whenNamed("DOCUSIGN");
  options
    .bind<SignatureClientFactory>(SIGNATURE_CLIENT_FACTORY)
    .toFactory(getSignatureClientFactory);

  options.bind<IDowJonesClient>(DOW_JONES_CLIENT).to(DowJonesClient);
  options.bind<DowJonesIntegration>(DowJonesIntegration).toSelf();

  options
    .bind<IIdVerificationIntegration>(BANKFLIP_ID_VERIFICATION_INTEGRATION)
    .to(BankflipIdVerificationIntegration);

  options
    .bind<IDocumentProcessingIntegration>(BANKFLIP_DOCUMENT_PROCESSING_INTEGRATION)
    .to(BankflipDocumentProcessingIntegration);

  options
    .bind<IProfileExternalSourceIntegration>(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    .to(EInformaProfileExternalSourceIntegration);
  options
    .bind<IProfileExternalSourceIntegration>(COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    .to(CompaniesHouseProfileExternalSourceIntegration);

  options
    .bind<IFileExportIntegration>(IMANAGE_FILE_EXPORT_INTEGRATION)
    .to(IManageFileExportIntegration);
});
