import express from "express";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "./config";
import { ContactRepository } from "./db/repositories/ContactRepository";
import { EmailLogRepository } from "./db/repositories/EmailLogRepository";
import { FeatureFlagRepository } from "./db/repositories/FeatureFlagRepository";
import { FileRepository } from "./db/repositories/FileRepository";
import { IntegrationRepository } from "./db/repositories/IntegrationRepository";
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
import { ANALYTICS, AnalyticsService } from "./services/analytics";
import { AUTH, Auth } from "./services/auth";
import { Aws, AWS_SERVICE } from "./services/aws";
import { EMAILS, EmailsService } from "./services/emails";
import { FetchService, FETCH_SERVICE } from "./services/fetch";
import { LOGGER, ILogger } from "./services/logger";
import { PRINTER, Printer } from "./services/printer";
import { SECURITY, SecurityService } from "./services/security";
import { SIGNATURE, SignatureService } from "./services/signature";
import { Smtp } from "./services/smtp";

@injectable()
export class ApiContext {
  user: User | null = null;
  contact: Contact | null = null;
  access: PetitionAccess | null = null;
  organization: Organization | null = null;
  req!: express.Request;
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(LOGGER) public logger: ILogger,
    // Services
    @inject(AUTH) public readonly auth: Auth,
    @inject(EMAILS) public readonly emails: EmailsService,
    @inject(SECURITY) public readonly security: SecurityService,
    @inject(SIGNATURE) public readonly signature: SignatureService,
    @inject(PRINTER) public readonly printer: Printer,
    @inject(AWS_SERVICE) public readonly aws: Aws,
    @inject(FETCH_SERVICE) public readonly fetch: FetchService,

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
    public readonly tasks: TaskRepository
  ) {}
}

@injectable()
export class WorkerContext {
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(LOGGER) public logger: ILogger,
    // Services
    @inject(AWS_SERVICE) public readonly aws: Aws,
    public readonly smtp: Smtp,
    @inject(EMAILS) public readonly emails: EmailsService,
    @inject(ANALYTICS) public readonly analytics: AnalyticsService,
    @inject(PRINTER) public readonly printer: Printer,
    @inject(SIGNATURE) public readonly signature: SignatureService,
    @inject(SECURITY) public readonly security: SecurityService,
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
    public readonly tasks: TaskRepository
  ) {}
}
