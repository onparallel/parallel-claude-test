import express from "express";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "./config";
import { ContactRepository } from "./db/repositories/ContactRepository";
import { EmailLogRepository } from "./db/repositories/EmailLogRepository";
import { FileUploadRepository } from "./db/repositories/FileUploadRepository";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { ReportingRepository } from "./db/repositories/ReportingRepository";
import { UserRepository } from "./db/repositories/UserRepository";
import { Contact, PetitionAccess, User } from "./db/__types";
import { AUTH, Auth } from "./services/auth";
import { Aws } from "./services/aws";
import { Cognito } from "./services/cognito";
import { EMAILS, EmailsService } from "./services/emails";
import { LOGGER, Logger } from "./services/logger";
import { PRINTER, Printer } from "./services/printer";
import { Smtp } from "./services/smtp";
import { ANALYTICS, AnalyticsService } from "./services/analytics";
import { FeatureFlagRepository } from "./db/repositories/FeatureFlagRepository";
import { IntegrationRepository } from "./db/repositories/IntegrationRepository";
import { SIGNATURE, SignatureService } from "./services/signature";

@injectable()
export class ApiContext {
  user: User | null = null;
  contact: Contact | null = null;
  access: PetitionAccess | null = null;
  req!: express.Request;
  constructor(
    @inject(LOGGER) public logger: Logger,
    // Services
    @inject(AUTH) public readonly auth: Auth,
    @inject(EMAILS) public readonly emails: EmailsService,
    @inject(ANALYTICS) public readonly analytics: AnalyticsService,
    @inject(SIGNATURE) public readonly signature: SignatureService,
    public readonly aws: Aws,
    public readonly cognito: Cognito,
    // Repositories
    public readonly contacts: ContactRepository,
    public readonly emailLogs: EmailLogRepository,
    public readonly featureFlags: FeatureFlagRepository,
    public readonly files: FileUploadRepository,
    public readonly integrations: IntegrationRepository,
    public readonly users: UserRepository,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository
  ) {}
}

@injectable()
export class WorkerContext {
  constructor(
    @inject(CONFIG) public config: Config,
    @inject(LOGGER) public logger: Logger,
    // Services
    public readonly aws: Aws,
    public readonly smtp: Smtp,
    @inject(EMAILS) public readonly emails: EmailsService,
    @inject(ANALYTICS) public readonly analytics: AnalyticsService,
    @inject(PRINTER) public readonly printer: Printer,
    @inject(SIGNATURE) public readonly signature: SignatureService,
    // Repositories
    public readonly contacts: ContactRepository,
    public readonly emailLogs: EmailLogRepository,
    public readonly files: FileUploadRepository,
    public readonly integrations: IntegrationRepository,
    public readonly users: UserRepository,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository,
    public readonly reporting: ReportingRepository
  ) {}
}
