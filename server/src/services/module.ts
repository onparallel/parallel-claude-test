import { ContainerModule } from "inversify";
import {
  ACCOUNT_SETUP_SERVICE,
  AccountSetupService,
  IAccountSetupService,
} from "./AccountSetupService";
import {
  AI_ASSISTANT_SERVICE,
  AiAssistantService,
  IAiAssistantService,
} from "./AiAssistantService";
import {
  AI_COMPLETION_SERVICE,
  AiCompletionService,
  IAiCompletionService,
} from "./AiCompletionService";
import { ANALYTICS, AnalyticsService, IAnalyticsService } from "./AnalyticsService";
import { AUTH, Auth, IAuth } from "./AuthService";
import {
  BACKGROUND_CHECK_SERVICE,
  BackgroundCheckService,
  IBackgroundCheckService,
} from "./BackgroundCheckService";
import { BANKFLIP_SERVICE, BankflipService, IBankflipService } from "./BankflipService";
import {
  DOCUMENT_PROCESSING_SERVICE,
  DocumentProcessingService,
  IDocumentProcessingService,
} from "./DocumentProcessingService";
import { EMAILS, EmailsService, IEmailsService } from "./EmailsService";
import { ENCRYPTION_SERVICE, EncryptionService, IEncryptionService } from "./EncryptionService";
import {
  EVENT_SUBSCRIPTION_SERVICE,
  EventSubscriptionService,
  IEventSubscriptionService,
} from "./EventSubscriptionService";
import { FETCH_SERVICE, FetchService, IFetchService } from "./FetchService";
import { FILE_EXPORT_SERVICE, FileExportService, IFileExportService } from "./FileExportService";
import { I18N_SERVICE, I18nService, II18nService } from "./I18nService";
import {
  ID_VERIFICATION_SERVICE,
  IIdVerificationService,
  IdVerificationService,
} from "./IdVerificationService";
import { IImageService, IMAGE_SERVICE, ImageService } from "./ImageService";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
  IntegrationsSetupService,
} from "./IntegrationsSetupService";
import { ILogger, LOGGER, createLogger } from "./Logger";
import { IOrgLimitsService, ORG_LIMITS_SERVICE, OrgLimitsService } from "./OrgLimitsService";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
  OrganizationCreditsService,
} from "./OrganizationCreditsService";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
  OrganizationLayoutService,
} from "./OrganizationLayoutService";
import { IPetitionBinder, PETITION_BINDER, PetitionBinder } from "./PetitionBinder";
import {
  IPetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
  PetitionImportExportService,
} from "./PetitionImportExportService";
import {
  IPetitionMessageContextService,
  PETITION_MESSAGE_CONTEXT_SERVICE,
  PetitionMessageContextService,
} from "./PetitionMessageContextService";
import { IPrinter, PRINTER, Printer } from "./Printer";
import {
  IProfileExternalSourcesService,
  PROFILE_EXTERNAL_SOURCE_SERVICE,
  ProfileExternalSourcesService,
} from "./ProfileExternalSourcesService";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
  ProfilesSetupService,
} from "./ProfilesSetupService";
import { IQueuesService, QUEUES_SERVICE, QueuesService } from "./QueuesService";
import { IRedis, REDIS, Redis } from "./Redis";
import { ISignatureService, SIGNATURE, SignatureService } from "./SignatureService";
import { ISmtp, SMTP, Smtp } from "./Smtp";
import { IStorageService, STORAGE_SERVICE, StorageService } from "./StorageService";

export const servicesModule = new ContainerModule((bind) => {
  bind<ILogger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  bind<IAuth>(AUTH).to(Auth);
  bind<IQueuesService>(QUEUES_SERVICE).to(QueuesService).inSingletonScope();
  bind<IEmailsService>(EMAILS).to(EmailsService);
  bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  bind<ISmtp>(SMTP).to(Smtp).inSingletonScope();
  bind<IPrinter>(PRINTER).to(Printer);
  bind<ISignatureService>(SIGNATURE).to(SignatureService);
  bind<IStorageService>(STORAGE_SERVICE).to(StorageService);
  bind<IFetchService>(FETCH_SERVICE).to(FetchService).inSingletonScope();
  bind<IImageService>(IMAGE_SERVICE).to(ImageService).inSingletonScope();
  bind<IPetitionBinder>(PETITION_BINDER).to(PetitionBinder);
  bind<IOrgLimitsService>(ORG_LIMITS_SERVICE).to(OrgLimitsService);
  bind<II18nService>(I18N_SERVICE).to(I18nService).inSingletonScope();
  bind<IEncryptionService>(ENCRYPTION_SERVICE).to(EncryptionService).inSingletonScope();
  bind<IOrganizationCreditsService>(ORGANIZATION_CREDITS_SERVICE).to(OrganizationCreditsService);
  bind<IBankflipService>(BANKFLIP_SERVICE).to(BankflipService);
  bind<IPetitionImportExportService>(PETITION_IMPORT_EXPORT_SERVICE).to(
    PetitionImportExportService,
  );
  bind<IOrganizationLayoutService>(ORGANIZATION_LAYOUT_SERVICE).to(OrganizationLayoutService);
  bind<IAccountSetupService>(ACCOUNT_SETUP_SERVICE).to(AccountSetupService);
  bind<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE).to(IntegrationsSetupService);
  bind<IProfilesSetupService>(PROFILES_SETUP_SERVICE).to(ProfilesSetupService);
  bind<IPetitionMessageContextService>(PETITION_MESSAGE_CONTEXT_SERVICE).to(
    PetitionMessageContextService,
  );
  bind<IAiCompletionService>(AI_COMPLETION_SERVICE).to(AiCompletionService);
  bind<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE).to(BackgroundCheckService);
  bind<IEventSubscriptionService>(EVENT_SUBSCRIPTION_SERVICE).to(EventSubscriptionService);
  bind<IIdVerificationService>(ID_VERIFICATION_SERVICE).to(IdVerificationService);
  bind<IDocumentProcessingService>(DOCUMENT_PROCESSING_SERVICE).to(DocumentProcessingService);
  bind<IProfileExternalSourcesService>(PROFILE_EXTERNAL_SOURCE_SERVICE).to(
    ProfileExternalSourcesService,
  );
  bind<IAiAssistantService>(AI_ASSISTANT_SERVICE).to(AiAssistantService).inSingletonScope();
  bind<IFileExportService>(FILE_EXPORT_SERVICE).to(FileExportService);
});
