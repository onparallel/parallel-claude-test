import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../config";
import { CreateOrganization, CreateUserData, Organization, User } from "../db/__types";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { IIntegrationsSetupService, INTEGRATIONS_SETUP_SERVICE } from "./IntegrationsSetupService";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "./ProfilesSetupService";
import { ITiersService, TIERS_SERVICE } from "./TiersService";

export const ACCOUNT_SETUP_SERVICE = Symbol.for("ACCOUNT_SETUP_SERVICE");
export interface IAccountSetupService {
  createOrganization(
    tier: string,
    data: CreateOrganization,
    userData: CreateUserData,
    createdBy: string,
  ): Promise<{ organization: Organization; user: User }>;
}

@injectable()
export class AccountSetupService implements IAccountSetupService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(INTEGRATIONS_SETUP_SERVICE) private integrationsSetup: IIntegrationsSetupService,
    @inject(PROFILES_SETUP_SERVICE) private profilesSetup: IProfilesSetupService,
    @inject(TIERS_SERVICE) private tiers: ITiersService,
  ) {}

  async createOrganization(
    tier: string,
    data: CreateOrganization,
    userData: CreateUserData,
    createdBy: string,
  ) {
    const organization = await this.organizations.createOrganization(data, createdBy);

    await this.organizations.createDefaultOrganizationThemes(organization.id, createdBy);
    await this.profilesSetup.createDefaultOrganizationProfileTypesAndFields(
      organization.id,
      createdBy,
    );
    await this.integrationsSetup.createSignaturitIntegration(
      {
        name: "Signaturit Sandbox",
        org_id: organization.id,
        is_default: true,
      },
      this.config.signature.signaturitSandboxApiKey,
      false,
      createdBy,
    );

    await this.tiers.updateOrganizationTier(organization, tier, createdBy);

    const user = await this.users.createUser(
      {
        organization_role: "OWNER",
        org_id: organization.id,
        status: "ACTIVE",
      },
      userData,
      createdBy,
    );

    return {
      // load org to get updated usage_details
      organization: (await this.organizations.loadOrg(organization.id))!,
      user,
    };
  }
}
