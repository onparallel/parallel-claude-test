import express from "express";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "./config";
import { Contact, Organization, PetitionAccess, User } from "./db/__types";
import { readOnly } from "./db/knex";
import { ContactRepository } from "./db/repositories/ContactRepository";
import { EmailLogRepository } from "./db/repositories/EmailLogRepository";
import { EventRepository } from "./db/repositories/EventRepository";
import { FeatureFlagRepository } from "./db/repositories/FeatureFlagRepository";
import { FileRepository } from "./db/repositories/FileRepository";
import { IntegrationRepository } from "./db/repositories/IntegrationRepository";
import { LicenseCodeRepository } from "./db/repositories/LicenseCodeRepository";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { PetitionViewRepository } from "./db/repositories/PetitionViewRepository";
import { ProfileRepository } from "./db/repositories/ProfileRepository";
import { SubscriptionRepository } from "./db/repositories/SubscriptionRepository";
import { SystemRepository } from "./db/repositories/SystemRepository";
import { TagRepository } from "./db/repositories/TagRepository";
import { TaskRepository } from "./db/repositories/TaskRepository";
import { UserAuthenticationRepository } from "./db/repositories/UserAuthenticationRepository";
import { UserGroupRepository } from "./db/repositories/UserGroupRepository";
import { UserRepository } from "./db/repositories/UserRepository";
import { DOW_JONES_CLIENT, IDowJonesClient } from "./integrations/dow-jones/DowJonesClient";
import { ACCOUNT_SETUP_SERVICE, IAccountSetupService } from "./services/AccountSetupService";
import { AI_COMPLETION_SERVICE, AiCompletionService } from "./services/AiCompletionService";
import { ANALYTICS, IAnalyticsService } from "./services/AnalyticsService";
import { AUTH, IAuth } from "./services/AuthService";
import {
  BACKGROUND_CHECK_SERVICE,
  BackgroundCheckService,
} from "./services/BackgroundCheckService";
import { BANKFLIP_SERVICE, IBankflipService } from "./services/BankflipService";
import { EMAILS, IEmailsService } from "./services/EmailsService";
import { ENCRYPTION_SERVICE, EncryptionService } from "./services/EncryptionService";
import {
  EVENT_SUBSCRIPTION_SERVICE,
  EventSubscriptionService,
} from "./services/EventSubscriptionService";
import { FETCH_SERVICE, IFetchService } from "./services/FetchService";
import { I18N_SERVICE, II18nService } from "./services/I18nService";
import { ID_VERIFICATION_SERVICE, IdVerificationService } from "./services/IdVerificationService";
import { IImageService, IMAGE_SERVICE } from "./services/ImageService";
import {
  IIntegrationsSetupService,
  INTEGRATIONS_SETUP_SERVICE,
} from "./services/IntegrationsSetupService";
import { ILogger, LOGGER } from "./services/Logger";
import { IOrgLimitsService, ORG_LIMITS_SERVICE } from "./services/OrgLimitsService";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "./services/OrganizationCreditsService";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "./services/OrganizationLayoutService";
import { IPetitionBinder, PETITION_BINDER } from "./services/PetitionBinder";
import {
  IPetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
} from "./services/PetitionImportExportService";
import {
  PETITION_MESSAGE_CONTEXT_SERVICE,
  PetitionMessageContextService,
} from "./services/PetitionMessageContextService";
import { IPrinter, PRINTER } from "./services/Printer";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "./services/ProfilesSetupService";
import { IQueuesService, QUEUES_SERVICE } from "./services/QueuesService";
import { IRedis, REDIS } from "./services/Redis";
import { ISignatureService, SIGNATURE } from "./services/SignatureService";
import { ISmtp, SMTP } from "./services/Smtp";
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
    @inject(PRINTER) public readonly printer: IPrinter,
    @inject(FETCH_SERVICE) public readonly fetch: IFetchService,
    @inject(IMAGE_SERVICE) public readonly images: IImageService,
    @inject(ORG_LIMITS_SERVICE) public readonly orgLimits: IOrgLimitsService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService,
    @inject(STORAGE_SERVICE) public readonly storage: IStorageService,
    @inject(ENCRYPTION_SERVICE) public readonly encryption: EncryptionService,
    @inject(ORGANIZATION_CREDITS_SERVICE) public readonly orgCredits: IOrganizationCreditsService,
    @inject(DOW_JONES_CLIENT) public readonly dowJonesKyc: IDowJonesClient,
    @inject(REDIS) public readonly redis: IRedis,
    @inject(BANKFLIP_SERVICE) public readonly bankflip: IBankflipService,
    @inject(PETITION_IMPORT_EXPORT_SERVICE)
    public readonly petitionImportExport: IPetitionImportExportService,
    @inject(PETITION_MESSAGE_CONTEXT_SERVICE)
    public readonly petitionMessageContext: PetitionMessageContextService,
    @inject(AI_COMPLETION_SERVICE) public readonly aiCompletion: AiCompletionService,
    @inject(BACKGROUND_CHECK_SERVICE) public readonly backgroundCheck: BackgroundCheckService,
    @inject(EVENT_SUBSCRIPTION_SERVICE) public readonly eventSubscription: EventSubscriptionService,

    // Setup services
    @inject(ACCOUNT_SETUP_SERVICE) public readonly accountSetup: IAccountSetupService,
    @inject(INTEGRATIONS_SETUP_SERVICE)
    public readonly integrationsSetup: IIntegrationsSetupService,
    @inject(PROFILES_SETUP_SERVICE)
    public readonly profilesSetup: IProfilesSetupService,
    @inject(ID_VERIFICATION_SERVICE) public readonly idVerification: IdVerificationService,

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
    public readonly views: PetitionViewRepository,
    public readonly profiles: ProfileRepository,
  ) {}
}

@injectable()
export class WorkerContext {
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(LOGGER) public logger: ILogger,
    // Services
    @inject(SMTP) public readonly smtp: ISmtp,
    @inject(EMAILS) public readonly emails: IEmailsService,
    @inject(ANALYTICS) public readonly analytics: IAnalyticsService,
    @inject(PRINTER) public readonly printer: IPrinter,
    @inject(SIGNATURE) public readonly signature: ISignatureService,
    @inject(PETITION_BINDER) public readonly petitionBinder: IPetitionBinder,
    @inject(IMAGE_SERVICE) public readonly images: IImageService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService,
    @inject(STORAGE_SERVICE) public readonly storage: IStorageService,
    @inject(QUEUES_SERVICE) public readonly queues: IQueuesService,
    @inject(ORG_LIMITS_SERVICE) public readonly orgLimits: IOrgLimitsService,
    @inject(DOW_JONES_CLIENT) public readonly dowJonesKyc: IDowJonesClient,
    @inject(ORGANIZATION_LAYOUT_SERVICE)
    public readonly layouts: IOrganizationLayoutService,
    @inject(FETCH_SERVICE) public readonly fetch: IFetchService,
    @inject(ENCRYPTION_SERVICE) public readonly encryption: EncryptionService,
    @inject(PETITION_MESSAGE_CONTEXT_SERVICE)
    public readonly petitionMessageContext: PetitionMessageContextService,
    @inject(BANKFLIP_SERVICE) public readonly bankflip: IBankflipService,
    @inject(ORGANIZATION_CREDITS_SERVICE) public readonly orgCredits: IOrganizationCreditsService,
    @inject(AI_COMPLETION_SERVICE) public readonly aiCompletion: AiCompletionService,
    @inject(BACKGROUND_CHECK_SERVICE) public readonly backgroundCheck: BackgroundCheckService,
    @inject(EVENT_SUBSCRIPTION_SERVICE) public readonly eventSubscription: EventSubscriptionService,
    @inject(REDIS) public readonly redis: IRedis,
    @inject(ID_VERIFICATION_SERVICE) public readonly idVerification: IdVerificationService,

    // Repositories
    public readonly contacts: ContactRepository,
    public readonly emailLogs: EmailLogRepository,
    public readonly featureFlags: FeatureFlagRepository,
    public readonly files: FileRepository,
    public readonly integrations: IntegrationRepository,
    public readonly users: UserRepository,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository,
    public readonly system: SystemRepository,
    public readonly userGroups: UserGroupRepository,
    public readonly subscriptions: SubscriptionRepository,
    public readonly tasks: TaskRepository,
    public readonly profiles: ProfileRepository,
    public readonly events: EventRepository,

    @readOnly public readonly readonlyContacts: ContactRepository,
    @readOnly public readonly readonlyPetitions: PetitionRepository,
    @readOnly public readonly readonlyUsers: UserRepository,
    @readOnly public readonly readonlyTags: TagRepository,
  ) {}
}
