import express from "express";
import { injectable } from "inversify";
import { OrganizationReposistory } from "./db/repositories/organizations";
import { UserReposistory } from "./db/repositories/users";
import { User } from "./db/__types";
import { Auth } from "./services/auth";
import { Cognito } from "./services/cognito";

@injectable()
export class Context {
  user!: User;
  req!: express.Request;
  constructor(
    public readonly auth: Auth,
    public readonly cognito: Cognito,
    public readonly users: UserReposistory,
    public readonly organizations: OrganizationReposistory
  ) {}
}
