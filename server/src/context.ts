import express from "express";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "./config";
import { Contact, Organization, PetitionAccess, User } from "./db/__types";
import { ContactRepository } from "./db/repositories/ContactRepository";
import { DashboardRepository } from "./db/repositories/DashboardRepository";
import { EmailLogRepository } from "./db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "./db/repositories/FeatureFlagRepository";
import { FileRepository } from "./db/repositories/FileRepository";
import { IntegrationRepository } from "./db/repositories/IntegrationRepository";
import { LicenseCodeRepository } from "./db/repositories/LicenseCodeRepository";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { PetitionApprovalRequestRepository } from "./db/repositories/PetitionApprovalRequestRepository";
import { PetitionCommentRepository } from "./db/repositories/PetitionCommentRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { ProfileRepository } from "./db/repositories/ProfileRepository";
import { SubscriptionRepository } from "./db/repositories/SubscriptionRepository";
import { SystemRepository } from "./db/repositories/SystemRepository";
import { TagRepository } from "./db/repositories/TagRepository";
import { TaskRepository } from "./db/repositories/TaskRepository";
import { UserAuthenticationRepository } from "./db/repositories/UserAuthenticationRepository";
import { UserGroupRepository } from "./db/repositories/UserGroupRepository";
import { UserRepository } from "./db/repositories/UserRepository";
import { ViewRepository } from "./db/repositories/ViewRepository";
import { DOW_JONES_CLIENT, IDowJonesClient } from "./integrations/dow-jones/DowJonesClient";
import { ACCOUNT_SETUP_SERVICE, IAccountSetupService } from "./services/AccountSetupService";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  IAdverseMediaSearchService,
} from "./services/AdverseMediaSearchService";
import { AI_ASSISTANT_SERVICE, IAiAssistantService } from "./services/AiAssistantService";
import { APPROVALS_SERVICE, IApprovalsService } from "./services/ApprovalsService";
import { AUTH, IAuth } from "./services/AuthService";
import {
  BACKGROUND_CHECK_SERVICE,
  IBackgroundCheckService,
} from "./services/BackgroundCheckService";
import { BANKFLIP_SERVICE, IBankflipService } from "./services/BankflipService";
import { EMAILS, IEmailsService } from "./services/EmailsService";
import { ENCRYPTION_SERVICE, IEncryptionService } from "./services/EncryptionService";
import {
  EVENT_SUBSCRIPTION_SERVICE,
  IEventSubscriptionService,
} from "./services/EventSubscriptionService";
import { FETCH_SERVICE, IFetchService } from "./services/FetchService";
import { I18N_SERVICE, II18nService } from "./services/I18nService";
import { ID_VERIFICATION_SERVICE, IdVerificationService } from "./services/IdVerificationService";
import { IImageService, IMAGE_SERVICE } from "./services/ImageService";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
} from "./services/IntegrationsSetupService";
import { IJwtService, JWT_SERVICE } from "./services/JwtService";
import { ILogger, LOGGER } from "./services/Logger";
import { IOrgLimitsService, ORG_LIMITS_SERVICE } from "./services/OrgLimitsService";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "./services/OrganizationCreditsService";
import { PETITION_FIELD_SERVICE, PetitionFieldService } from "./services/PetitionFieldService";
import {
  IPetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
} from "./services/PetitionImportExportService";
import {
  IPetitionMessageContextService,
  PETITION_MESSAGE_CONTEXT_SERVICE,
} from "./services/PetitionMessageContextService";
import {
  PETITION_VALIDATION_SERVICE,
  PetitionValidationService,
} from "./services/PetitionValidationService";
import {
  PETITIONS_HELPER_SERVICE,
  PetitionsHelperService,
} from "./services/PetitionsHelperService";
import {
  PROFILE_EXCEL_IMPORT_SERVICE,
  ProfileExcelImportService,
} from "./services/ProfileExcelImportService";
import {
  IProfileExternalSourcesService,
  PROFILE_EXTERNAL_SOURCE_SERVICE,
} from "./services/ProfileExternalSourcesService";
import {
  PROFILE_TYPE_FIELD_SERVICE,
  ProfileTypeFieldService,
} from "./services/ProfileTypeFieldService";
import {
  PROFILE_VALIDATION_SERVICE,
  ProfileValidationService,
} from "./services/ProfileValidationService";
import { PROFILES_HELPER_SERVICE, ProfilesHelperService } from "./services/ProfilesHelperService";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "./services/ProfilesSetupService";
import { IRedis, REDIS } from "./services/Redis";
import { ISignatureService, SIGNATURE } from "./services/SignatureService";
import { IStorageService, STORAGE_SERVICE } from "./services/StorageService";

@injectable()
export class ApiContext {
  user: User | null = null;
  realUser: User | null = null;
  contact: Contact | null = null;
  access: PetitionAccess | null = null;
  organization: Organization | null = null;
  // @apollo server shallowly clones the context so we need a place to put this
  // so express can access this later for loggin
  readonly trails: Record<string, any> = {};

  req!: express.Request;
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(LOGGER) public logger: ILogger,

    // Services
    @inject(AUTH) public readonly auth: IAuth,
    @inject(EMAILS) public readonly emails: IEmailsService,
    @inject(SIGNATURE) public readonly signature: ISignatureService,
    @inject(FETCH_SERVICE) public readonly fetch: IFetchService,
    @inject(IMAGE_SERVICE) public readonly images: IImageService,
    @inject(ORG_LIMITS_SERVICE) public readonly orgLimits: IOrgLimitsService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService,
    @inject(STORAGE_SERVICE) public readonly storage: IStorageService,
    @inject(ENCRYPTION_SERVICE) public readonly encryption: IEncryptionService,
    @inject(JWT_SERVICE) public readonly jwt: IJwtService,
    @inject(ORGANIZATION_CREDITS_SERVICE) public readonly orgCredits: IOrganizationCreditsService,
    @inject(DOW_JONES_CLIENT) public readonly dowJonesKyc: IDowJonesClient,
    @inject(REDIS) public readonly redis: IRedis,
    @inject(BANKFLIP_SERVICE) public readonly bankflip: IBankflipService,
    @inject(PETITION_IMPORT_EXPORT_SERVICE)
    public readonly petitionImportExport: IPetitionImportExportService,
    @inject(PETITION_MESSAGE_CONTEXT_SERVICE)
    public readonly petitionMessageContext: IPetitionMessageContextService,
    @inject(BACKGROUND_CHECK_SERVICE) public readonly backgroundCheck: IBackgroundCheckService,
    @inject(EVENT_SUBSCRIPTION_SERVICE)
    public readonly eventSubscription: IEventSubscriptionService,
    @inject(ID_VERIFICATION_SERVICE) public readonly idVerification: IdVerificationService,
    @inject(PROFILE_EXTERNAL_SOURCE_SERVICE)
    public readonly profileExternalSources: IProfileExternalSourcesService,
    @inject(PROFILE_EXCEL_IMPORT_SERVICE)
    public readonly profileExcelImport: ProfileExcelImportService,
    @inject(ADVERSE_MEDIA_SEARCH_SERVICE) public readonly adverseMedia: IAdverseMediaSearchService,
    @inject(AI_ASSISTANT_SERVICE) public readonly aiAssistant: IAiAssistantService,
    @inject(APPROVALS_SERVICE) public readonly approvals: IApprovalsService,

    // Petition helper services
    @inject(PETITIONS_HELPER_SERVICE) public readonly petitionsHelper: PetitionsHelperService,
    @inject(PETITION_VALIDATION_SERVICE)
    public readonly petitionValidation: PetitionValidationService,
    @inject(PETITION_FIELD_SERVICE)
    public readonly petitionFields: PetitionFieldService,

    // Profile helper services
    @inject(PROFILES_HELPER_SERVICE) public readonly profilesHelper: ProfilesHelperService,
    @inject(PROFILE_VALIDATION_SERVICE)
    public readonly profileValidation: ProfileValidationService,
    @inject(PROFILE_TYPE_FIELD_SERVICE)
    public readonly profileTypeFields: ProfileTypeFieldService,

    // Setup services
    @inject(ACCOUNT_SETUP_SERVICE) public readonly accountSetup: IAccountSetupService,
    @inject(INTEGRATIONS_SETUP_SERVICE)
    public readonly integrationsSetup: IIntegrationsSetupService,
    @inject(PROFILES_SETUP_SERVICE)
    public readonly profilesSetup: IProfilesSetupService,

    // Repositories
    public readonly contacts: ContactRepository,
    public readonly emailLogs: EmailLogRepository,
    public readonly featureFlags: FeatureFlagRepository,
    public readonly files: FileRepository,
    public readonly integrations: IntegrationRepository,
    public readonly users: UserRepository,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository,
    public readonly userAuthentication: UserAuthenticationRepository,
    public readonly userGroups: UserGroupRepository,
    public readonly tags: TagRepository,
    public readonly system: SystemRepository,
    public readonly subscriptions: SubscriptionRepository,
    public readonly tasks: TaskRepository,
    public readonly licenseCodes: LicenseCodeRepository,
    public readonly views: ViewRepository,
    public readonly profiles: ProfileRepository,
    public readonly dashboards: DashboardRepository,
    public readonly approvalRequests: PetitionApprovalRequestRepository,
    public readonly petitionComments: PetitionCommentRepository,
  ) {}
}
