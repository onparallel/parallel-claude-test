import { ContainerModule } from "inversify";
import {
  ACCOUNT_SETUP_SERVICE,
  AccountSetupService,
  IAccountSetupService,
} from "./AccountSetupService";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  AdverseMediaSearchService,
  IAdverseMediaSearchService,
} from "./AdverseMediaSearchService";
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
import { APPROVALS_SERVICE, ApprovalsService } from "./ApprovalsService";
import { AUTH, Auth, IAuth } from "./AuthService";
import {
  BACKGROUND_CHECK_SERVICE,
  BackgroundCheckService,
  IBackgroundCheckService,
} from "./BackgroundCheckService";
import { BANKFLIP_SERVICE, BankflipService, IBankflipService } from "./BankflipService";
import { CORS_SERVICE, CorsService, ICorsService } from "./CorsService";
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
import { IJwtService, JWT_SERVICE, JwtService } from "./JwtService";
import {
  ILogger,
  LOGGER,
  LOGGER_FACTORY,
  LoggerFactory,
  createLogger,
  getLoggerFactory,
} from "./Logger";
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
import { PETITION_FIELD_SERVICE, PetitionFieldService } from "./PetitionFieldService";
import { PETITION_FILES_SERVICE, PetitionFilesService } from "./PetitionFilesService";
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
import {
  PETITION_VALIDATION_SERVICE,
  PetitionValidationService,
} from "./PetitionValidationService";
import { PETITIONS_HELPER_SERVICE, PetitionsHelperService } from "./PetitionsHelperService";
import { IPrinter, PRINTER, Printer } from "./Printer";
import {
  PROFILE_EXCEL_EXPORT_SERVICE,
  ProfileExcelExportService,
} from "./ProfileExcelExportService";
import {
  PROFILE_EXCEL_IMPORT_SERVICE,
  ProfileExcelImportService,
} from "./ProfileExcelImportService";
import {
  IProfileExternalSourcesService,
  PROFILE_EXTERNAL_SOURCE_SERVICE,
  ProfileExternalSourcesService,
} from "./ProfileExternalSourcesService";
import { PROFILE_SYNC_SERVICE, ProfileSyncService } from "./ProfileSyncService";
import { PROFILE_TYPE_FIELD_SERVICE, ProfileTypeFieldService } from "./ProfileTypeFieldService";
import { PROFILE_VALIDATION_SERVICE, ProfileValidationService } from "./ProfileValidationService";
import { PROFILES_HELPER_SERVICE, ProfilesHelperService } from "./ProfilesHelperService";
import {
  IProfilesSetupService,
  PROFILES_SETUP_SERVICE,
  ProfilesSetupService,
} from "./ProfilesSetupService";
import { IQueuesService, QUEUES_SERVICE, QueuesService } from "./QueuesService";
import { IRateLimitService, RATE_LIMIT_SERVICE, RateLimitService } from "./RateLimitService";
import { IRedis, REDIS, Redis } from "./Redis";
import { ISignatureService, SIGNATURE, SignatureService } from "./SignatureService";
import { ISmtp, SMTP, Smtp } from "./Smtp";
import { IStorageService, STORAGE_SERVICE, StorageService } from "./StorageService";

export const servicesModule = new ContainerModule((options) => {
  // Singleton Scope
  options.bind<ILogger>(LOGGER).toDynamicValue(createLogger).inSingletonScope();
  options.bind<LoggerFactory>(LOGGER_FACTORY).toFactory(getLoggerFactory);
  options.bind<IQueuesService>(QUEUES_SERVICE).to(QueuesService).inSingletonScope();
  options.bind<IEmailsService>(EMAILS).to(EmailsService).inSingletonScope();
  options.bind<IAnalyticsService>(ANALYTICS).to(AnalyticsService).inSingletonScope();
  options.bind<IRedis>(REDIS).to(Redis).inSingletonScope();
  options.bind<IRateLimitService>(RATE_LIMIT_SERVICE).to(RateLimitService).inSingletonScope();
  options.bind<ISmtp>(SMTP).to(Smtp).inSingletonScope();
  options.bind<IPrinter>(PRINTER).to(Printer).inSingletonScope();
  options.bind<IStorageService>(STORAGE_SERVICE).to(StorageService).inSingletonScope();
  options.bind<IFetchService>(FETCH_SERVICE).to(FetchService).inSingletonScope();
  options.bind<IImageService>(IMAGE_SERVICE).to(ImageService).inSingletonScope();
  options.bind<II18nService>(I18N_SERVICE).to(I18nService).inSingletonScope();
  options.bind<IEncryptionService>(ENCRYPTION_SERVICE).to(EncryptionService).inSingletonScope();
  options.bind<IJwtService>(JWT_SERVICE).to(JwtService).inSingletonScope();
  options.bind<IAiAssistantService>(AI_ASSISTANT_SERVICE).to(AiAssistantService).inSingletonScope();
  options.bind<ICorsService>(CORS_SERVICE).to(CorsService).inSingletonScope();
  options
    .bind<IAdverseMediaSearchService>(ADVERSE_MEDIA_SEARCH_SERVICE)
    .to(AdverseMediaSearchService)
    .inSingletonScope();

  // Request Scope
  options.bind<IBackgroundCheckService>(BACKGROUND_CHECK_SERVICE).to(BackgroundCheckService);
  options
    .bind<IOrganizationCreditsService>(ORGANIZATION_CREDITS_SERVICE)
    .to(OrganizationCreditsService);
  options.bind<IAiCompletionService>(AI_COMPLETION_SERVICE).to(AiCompletionService);
  options.bind<IPetitionBinder>(PETITION_BINDER).to(PetitionBinder);
  options.bind<IAuth>(AUTH).to(Auth);
  options
    .bind<IPetitionImportExportService>(PETITION_IMPORT_EXPORT_SERVICE)
    .to(PetitionImportExportService);
  options.bind<ISignatureService>(SIGNATURE).to(SignatureService);
  options.bind<IOrgLimitsService>(ORG_LIMITS_SERVICE).to(OrgLimitsService);
  options.bind<IBankflipService>(BANKFLIP_SERVICE).to(BankflipService);
  options
    .bind<IOrganizationLayoutService>(ORGANIZATION_LAYOUT_SERVICE)
    .to(OrganizationLayoutService);
  options.bind<IAccountSetupService>(ACCOUNT_SETUP_SERVICE).to(AccountSetupService);
  options.bind<IIntegrationsSetupService>(INTEGRATIONS_SETUP_SERVICE).to(IntegrationsSetupService);
  options.bind<IProfilesSetupService>(PROFILES_SETUP_SERVICE).to(ProfilesSetupService);
  options
    .bind<IPetitionMessageContextService>(PETITION_MESSAGE_CONTEXT_SERVICE)
    .to(PetitionMessageContextService);
  options.bind<IEventSubscriptionService>(EVENT_SUBSCRIPTION_SERVICE).to(EventSubscriptionService);
  options.bind<IIdVerificationService>(ID_VERIFICATION_SERVICE).to(IdVerificationService);
  options
    .bind<IDocumentProcessingService>(DOCUMENT_PROCESSING_SERVICE)
    .to(DocumentProcessingService);
  options
    .bind<IProfileExternalSourcesService>(PROFILE_EXTERNAL_SOURCE_SERVICE)
    .to(ProfileExternalSourcesService);
  options.bind<PetitionFilesService>(PETITION_FILES_SERVICE).to(PetitionFilesService);
  options.bind(PROFILE_EXCEL_IMPORT_SERVICE).to(ProfileExcelImportService);
  options.bind(PROFILE_EXCEL_EXPORT_SERVICE).to(ProfileExcelExportService);
  options.bind(APPROVALS_SERVICE).to(ApprovalsService);

  // Petition helper services
  options.bind(PETITIONS_HELPER_SERVICE).to(PetitionsHelperService);
  options.bind(PETITION_VALIDATION_SERVICE).to(PetitionValidationService);
  options.bind(PETITION_FIELD_SERVICE).to(PetitionFieldService);

  // Profile helper services
  options.bind(PROFILES_HELPER_SERVICE).to(ProfilesHelperService);
  options.bind(PROFILE_VALIDATION_SERVICE).to(ProfileValidationService);
  options.bind(PROFILE_TYPE_FIELD_SERVICE).to(ProfileTypeFieldService);

  options.bind(PROFILE_SYNC_SERVICE).to(ProfileSyncService);
});
