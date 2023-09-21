import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../config";
import {
  CreateOrganization,
  CreateUserData,
  Organization,
  User,
  UserGroupPermissionName,
} from "../db/__types";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { UserGroupRepository } from "../db/repositories/UserGroupRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { I18N_SERVICE, II18nService } from "./I18nService";
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
    @inject(UserGroupRepository) private userGroups: UserGroupRepository,
    @inject(INTEGRATIONS_SETUP_SERVICE) private integrationsSetup: IIntegrationsSetupService,
    @inject(PROFILES_SETUP_SERVICE) private profilesSetup: IProfilesSetupService,
    @inject(TIERS_SERVICE) private tiers: ITiersService,
    @inject(I18N_SERVICE) private intl: II18nService,
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
    const owner = await this.createOrgOwner(organization.id, userData, createdBy);
    await this.createAllUsersGroup(organization.id, owner.id, createdBy);

    return {
      // load org to get updated usage_details
      organization: (await this.organizations.loadOrg(organization.id))!,
      user: owner,
    };
  }

  private async createOrgOwner(orgId: number, userData: CreateUserData, createdBy: string) {
    return await this.users.createUser(
      {
        is_org_owner: true,
        org_id: orgId,
        status: "ACTIVE",
      },
      userData,
      createdBy,
    );
  }

  private async createAllUsersGroup(orgId: number, userId: number, createdBy: string) {
    const userGroup = await this.userGroups.createUserGroup(
      {
        name: "",
        localizable_name: await this.intl.getLocalizableUserText({
          id: "account-setup.all-members-group.name",
          defaultMessage: "All users",
        }),
        org_id: orgId,
        type: "ALL_USERS",
      },
      createdBy,
    );
    await this.userGroups.addUsersToGroups(userGroup.id, userId, createdBy);
    await this.userGroups.upsertUserGroupPermissions(
      userGroup.id,
      (
        [
          "REPORTS:OVERVIEW",
          "REPORTS:TEMPLATE_STATISTICS",
          "REPORTS:TEMPLATE_REPLIES",
          "TAGS:CRUD_TAGS",
          "PROFILES:DELETE_PROFILES",
          "PROFILES:DELETE_PERMANENTLY_PROFILES",
          "PROFILE_TYPES:CRUD_PROFILE_TYPES",
          "INTEGRATIONS:CRUD_INTEGRATIONS",
          "USERS:CRUD_USERS",
          "USERS:GHOST_LOGIN",
          "TEAMS:CRUD_TEAMS",
          "TEAMS:CRUD_PERMISSIONS",
          "ORG_SETTINGS",
          "CONTACTS:DELETE_CONTACTS",
          "PETITIONS:SEND_ON_BEHALF",
          "PETITIONS:CHANGE_PATH",
          "PETITIONS:CREATE_TEMPLATES",
          "INTEGRATIONS:CRUD_API",
          "PROFILES:SUBSCRIBE_PROFILES",
          "PETITIONS:CREATE_PETITIONS",
          "PROFILES:CREATE_PROFILES",
          "PROFILES:CLOSE_PROFILES",
          "PROFILES:LIST_PROFILES",
          "PROFILE_ALERTS:LIST_ALERTS",
          "CONTACTS:LIST_CONTACTS",
          "USERS:LIST_USERS",
          "TEAMS:LIST_TEAMS",
        ] as UserGroupPermissionName[]
      ).map((name) => ({ effect: "GRANT", name })),
      createdBy,
    );
  }
}
