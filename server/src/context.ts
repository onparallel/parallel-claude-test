import express from "express";
import { injectable } from "inversify";
import { ContactReposistory } from "./db/repositories/ContactRepository";
import { FileUploadRepository } from "./db/repositories/FileUploadRepository";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { UserReposistory } from "./db/repositories/UserRepository";
import { Contact, User, PetitionSendout } from "./db/__types";
import { Auth } from "./services/auth";
import { Aws } from "./services/aws";
import { Cognito } from "./services/cognito";

@injectable()
export class Context {
  user: User | null = null;
  contact: Contact | null = null;
  sendout: PetitionSendout | null = null;
  req!: express.Request;
  constructor(
    // Services
    public readonly auth: Auth,
    public readonly aws: Aws,
    public readonly cognito: Cognito,
    // Repositories
    public readonly contacts: ContactReposistory,
    public readonly files: FileUploadRepository,
    public readonly users: UserReposistory,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository
  ) {}
}
