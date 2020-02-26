import express from "express";
import { injectable } from "inversify";
import { OrganizationRepository } from "./db/repositories/OrganizationRepository";
import { UserReposistory } from "./db/repositories/UserRepository";
import { User } from "./db/__types";
import { Auth } from "./services/auth";
import { Cognito } from "./services/cognito";
import { PetitionRepository } from "./db/repositories/PetitionRepository";
import { ContactReposistory } from "./db/repositories/ContactRepository";

@injectable()
export class Context {
  user!: User;
  req!: express.Request;
  constructor(
    public readonly auth: Auth,
    public readonly cognito: Cognito,
    // Repositories
    public readonly contacts: ContactReposistory,
    public readonly users: UserReposistory,
    public readonly organizations: OrganizationRepository,
    public readonly petitions: PetitionRepository
  ) {}
}
