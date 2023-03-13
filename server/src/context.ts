import express from "express";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "./config";
import { readOnly } from "./db/knex";
import { ContactRepository } from "./db/repositories/ContactRepository";
import { EmailLogRepository } from "./db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "./db/repositories/FeatureFlagRepository";
import { FileRepository } from "./db/repositories/FileRepository";
import { IntegrationRepository } from "./db/repositories/IntegrationRepository";
import { LicenseCodeRepository } from "./db/repositories/LicenseCodeRepository";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { PetitionViewRepository } from "./db/repositories/PetitionViewRepository";
import { SubscriptionRepository } from "./db/repositories/SubscriptionRepository";
import { SystemRepository } from "./db/repositories/SystemRepository";
import { TagRepository } from "./db/repositories/TagRepository";
import { TaskRepository } from "./db/repositories/TaskRepository";
import { UserAuthenticationRepository } from "./db/repositories/UserAuthenticationRepository";
import { UserGroupRepository } from "./db/repositories/UserGroupRepository";
import { UserRepository } from "./db/repositories/UserRepository";
import { Contact, Organization, PetitionAccess, User } from "./db/__types";
import { ANALYTICS, IAnalyticsService } from "./services/analytics";
import { AUTH, IAuth } from "./services/auth";
import { BANKFLIP_SERVICE, IBankflipService } from "./services/bankflip";
import { BANKFLIP_LEGACY_SERVICE, IBankflipLegacyService } from "./services/bankflip-legacy";
import { DOW_JONES_KYC_SERVICE, IDowJonesKycService } from "./services/dowjones";
import { EMAILS, IEmailsService } from "./services/emails";
import { FETCH_SERVICE, IFetchService } from "./services/fetch";
import { I18N_SERVICE, II18nService } from "./services/i18n";
import { IImageService, IMAGE_SERVICE } from "./services/image";
import { ILogger, LOGGER } from "./services/logger";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "./services/organization-credits";
import {
  IOrganizationLayoutService,
  ORGANIZATION_LAYOUT_SERVICE,
} from "./services/organization-layout";
import { IPetitionBinder, PETITION_BINDER } from "./services/petition-binder";
import {
  IPetitionImportExportService,
  PETITION_IMPORT_EXPORT_SERVICE,
} from "./services/petition-import-export";
import { IPrinter, PRINTER } from "./services/printer";
import { IQueuesService, QUEUES_SERVICE } from "./services/queues";
import { IRedis, REDIS } from "./services/redis";
import { IReportsService, REPORTS_SERVICE } from "./services/reports";
import { SetupService, SETUP_SERVICE } from "./services/setup";
import { ISignatureService, SIGNATURE } from "./services/signature";
import { ISmtp, SMTP } from "./services/smtp";
import { IStorageService, STORAGE_SERVICE } from "./services/storage";
import { ITiersService, TIERS_SERVICE } from "./services/tiers";

@injectable()
export class ApiContext {
  user: User | null = null;
  realUser: User | null = null;
  contact: Contact | null = null;
  access: PetitionAccess | null = null;
  organization: Organization | null = null;
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
    @inject(TIERS_SERVICE) public readonly tiers: ITiersService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService,
    @inject(STORAGE_SERVICE) public readonly storage: IStorageService,
    @inject(ORGANIZATION_CREDITS_SERVICE) public readonly orgCredits: IOrganizationCreditsService,
    @inject(DOW_JONES_KYC_SERVICE) public readonly dowJonesKyc: IDowJonesKycService,
    @inject(REDIS) public readonly redis: IRedis,
    @inject(BANKFLIP_SERVICE) public readonly bankflip: IBankflipService,
    // TODO Bankflip Legacy: old version of Bankflip API. Soon to be deprecated by them */
    @inject(BANKFLIP_LEGACY_SERVICE) public readonly bankflipLegacy: IBankflipLegacyService,
    @inject(PETITION_IMPORT_EXPORT_SERVICE)
    public readonly petitionImportExport: IPetitionImportExportService,
    @inject(SETUP_SERVICE) public readonly setup: SetupService,

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
    public readonly views: PetitionViewRepository
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
    @inject(TIERS_SERVICE) public readonly tiers: ITiersService,
    @inject(DOW_JONES_KYC_SERVICE) public readonly dowJonesKyc: IDowJonesKycService,
    @inject(ORGANIZATION_LAYOUT_SERVICE)
    public readonly layouts: IOrganizationLayoutService,
    @inject(FETCH_SERVICE) public readonly fetch: IFetchService,
    @inject(REPORTS_SERVICE) public readonly reports: IReportsService,

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

    @readOnly public readonly readonlyContacts: ContactRepository,
    @readOnly public readonly readonlyPetitions: PetitionRepository,
    @readOnly public readonly readonlyUsers: UserRepository,
    @readOnly public readonly readonlyTags: TagRepository
  ) {}
}
