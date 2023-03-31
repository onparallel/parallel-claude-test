import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../config";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { CreateOrganization, Organization } from "../db/__types";
import { IIntegrationsSetupService, INTEGRATIONS_SETUP_SERVICE } from "./IntegrationsSetupService";

export const ACCOUNT_SETUP_SERVICE = Symbol.for("ACCOUNT_SETUP_SERVICE");
export interface IAccountSetupService {
  createOrganization(data: CreateOrganization, createdBy: string): Promise<Organization>;
}

@injectable()
export class AccountSetupService implements IAccountSetupService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(INTEGRATIONS_SETUP_SERVICE) private integrationsSetup: IIntegrationsSetupService
  ) {}

  async createOrganization(data: CreateOrganization, createdBy: string) {
    const org = await this.organizations.createOrganization(data, createdBy);
    await this.organizations.createDefaultOrganizationThemes(org.id, createdBy);
    await this.integrationsSetup.createSignaturitIntegration(
      {
        name: "Signaturit Sandbox",
        org_id: org.id,
        is_default: true,
      },
      this.config.signature.signaturitSandboxApiKey,
      false,
      createdBy
    );

    return org;
  }
}
