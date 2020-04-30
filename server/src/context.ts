import express from "express";
import { inject, injectable } from "inversify";
import { CONFIG, Config } from "./config";
import { ContactRepository } from "./db/repositories/ContactRepository";
import { EmailLogRepository } from "./db/repositories/EmailLogRepository";
import { FileUploadRepository } from "./db/repositories/FileUploadRepository";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { ReminderRepository } from "./db/repositories/ReminderRepository";
import { UserRepository } from "./db/repositories/UserRepository";
import { Contact, PetitionSendout, User } from "./db/__types";
import { Auth } from "./services/auth";
import { Aws } from "./services/aws";
import { Cognito } from "./services/cognito";
import { LOGGER, Logger } from "./services/logger";
import { Smtp } from "./services/smtp";

@injectable()
export class ApiContext {
  user: User | null = null;
  contact: Contact | null = null;
  sendout: PetitionSendout | null = null;
  req!: express.Request;
  constructor(
    @inject(LOGGER) public logger: Logger,
    // Services
    public readonly auth: Auth,
    public readonly aws: Aws,
    public readonly cognito: Cognito,
    // Repositories
    public readonly contacts: ContactRepository,
    public readonly emails: EmailLogRepository,
    public readonly files: FileUploadRepository,
    public readonly users: UserRepository,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository,
    public readonly reminders: ReminderRepository
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
    // Repositories
    public readonly contacts: ContactRepository,
    public readonly emails: EmailLogRepository,
    public readonly files: FileUploadRepository,
    public readonly users: UserRepository,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository,
    public readonly reminders: ReminderRepository,
  ) {}
}
