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
import { AWS_SERVICE, IAws } from "./services/aws";
import { EMAILS, IEmailsService } from "./services/emails";
import { FETCH_SERVICE, IFetchService } from "./services/fetch";
import { I18N_SERVICE, II18nService } from "./services/i18n";
import { IImageService, IMAGE_SERVICE } from "./services/image";
import { ILogger, LOGGER } from "./services/logger";
import { IPetitionBinder, PETITION_BINDER } from "./services/petition-binder";
import { IPrinter, PRINTER } from "./services/printer";
import { ISignatureService, SIGNATURE } from "./services/signature";
import { ISmtp, SMTP } from "./services/smtp";
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
    @inject(AWS_SERVICE) public readonly aws: IAws,
    @inject(FETCH_SERVICE) public readonly fetch: IFetchService,
    @inject(IMAGE_SERVICE) public readonly images: IImageService,
    @inject(TIERS_SERVICE) public readonly tiers: ITiersService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService,

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
    public readonly licenseCodes: LicenseCodeRepository
  ) {}
}

@injectable()
export class WorkerContext {
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(LOGGER) public logger: ILogger,
    // Services
    @inject(AWS_SERVICE) public readonly aws: IAws,
    @inject(SMTP) public readonly smtp: ISmtp,
    @inject(EMAILS) public readonly emails: IEmailsService,
    @inject(ANALYTICS) public readonly analytics: IAnalyticsService,
    @inject(PRINTER) public readonly printer: IPrinter,
    @inject(SIGNATURE) public readonly signature: ISignatureService,
    @inject(PETITION_BINDER) public readonly petitionBinder: IPetitionBinder,
    @inject(IMAGE_SERVICE) public readonly images: IImageService,
    @inject(I18N_SERVICE) public readonly i18n: II18nService,

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
    @readOnly public readonly readonlyPetitions: PetitionRepository
  ) {}
}
