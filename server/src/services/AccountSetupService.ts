import { inject, injectable } from "inversify";
import { CONFIG, Config } from "../config";
import {
  CreateOrganization,
  CreateUser,
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
import { IOrgLimitsService, ORG_LIMITS_SERVICE } from "./OrgLimitsService";
import { PetitionViewRepository } from "../db/repositories/PetitionViewRepository";

export const ACCOUNT_SETUP_SERVICE = Symbol.for("ACCOUNT_SETUP_SERVICE");
export interface IAccountSetupService {
  createOrganization(
    tier: string,
    data: CreateOrganization,
    userData: CreateUserData,
    createdBy: string,
  ): Promise<{ organization: Organization; user: User }>;
  createUser(
    data: Omit<CreateUser, "user_data_id">,
    userData: CreateUserData,
    createdBy: string,
  ): Promise<User>;
}

@injectable()
export class AccountSetupService implements IAccountSetupService {
  constructor(
    @inject(CONFIG) private config: Config,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(UserGroupRepository) private userGroups: UserGroupRepository,
    @inject(PetitionViewRepository) private views: PetitionViewRepository,
    @inject(INTEGRATIONS_SETUP_SERVICE) private integrationsSetup: IIntegrationsSetupService,
    @inject(PROFILES_SETUP_SERVICE) private profilesSetup: IProfilesSetupService,
    @inject(ORG_LIMITS_SERVICE) private orgLimits: IOrgLimitsService,
    @inject(I18N_SERVICE) private intl: II18nService,
  ) {}

  async createUser(
    data: Omit<CreateUser, "user_data_id">,
    userData: CreateUserData,
    createdBy: string,
  ) {
    const user = await this.users.createUser(data, userData, createdBy);

    const groups = await this.userGroups.loadAllUsersGroupsByOrgId(user.org_id);
    await this.userGroups.addUsersToGroups(
      groups.map((g) => g.id),
      user.id,
      createdBy,
    );

    const intl = await this.intl.getIntl(userData.preferred_locale);
    const defaultView = {
      path: "/",
      sort: null,
      tags: null,
      search: null,
      status: null,
      searchIn: "EVERYWHERE",
      signature: null,
      sharedWith: null,
      fromTemplateId: null,
    };
    await this.views.createPetitionListView(
      (
        [
          [
            intl.formatMessage({
              id: "default-petition-list-views.ongoing",
              defaultMessage: "Ongoing",
            }),
            { ...defaultView, status: ["COMPLETED", "PENDING"] },
          ],
          [
            intl.formatMessage({
              id: "default-petition-list-views.closed",
              defaultMessage: "Closed",
            }),
            { ...defaultView, status: ["CLOSED"] },
          ],
          [
            intl.formatMessage({
              id: "default-petition-list-views.draft",
              defaultMessage: "Draft",
            }),
            { ...defaultView, status: ["DRAFT"] },
          ],
        ] as [string, any][]
      ).map(([name, data], index) => ({
        user_id: user.id,
        name,
        data,
        position: index,
        is_default: false,

        updated_by: `User:${user.id}`,
      })),
      `User:${user.id}`,
    );

    return user;
  }

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

    await this.createAllUsersGroup(organization.id, createdBy);

    await this.orgLimits.updateOrganizationTier(organization, tier, createdBy);
    const owner = await this.createUser(
      {
        org_id: organization.id,
        is_org_owner: true,
        status: "ACTIVE",
      },
      userData,
      createdBy,
    );

    return {
      // load org to get updated usage_details
      organization: (await this.organizations.loadOrg(organization.id))!,
      user: owner,
    };
  }

  private async createAllUsersGroup(orgId: number, createdBy: string) {
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
    await this.userGroups.upsertUserGroupPermissions(
      userGroup.id,
      (
        [
          "REPORTS:OVERVIEW",
          "REPORTS:TEMPLATE_STATISTICS",
          "REPORTS:TEMPLATE_REPLIES",
          "TAGS:CREATE_TAGS",
          "TAGS:UPDATE_TAGS",
          "TAGS:DELETE_TAGS",
          "PROFILES:DELETE_PROFILES",
          "PROFILES:DELETE_PERMANENTLY_PROFILES",
          "PROFILE_TYPES:CRUD_PROFILE_TYPES",
          "INTEGRATIONS:CRUD_INTEGRATIONS",
          "USERS:CRUD_USERS",
          "USERS:GHOST_LOGIN",
          "TEAMS:CRUD_TEAMS",
          "TEAMS:READ_PERMISSIONS",
          "TEAMS:UPDATE_PERMISSIONS",
          "ORG_SETTINGS",
          "CONTACTS:DELETE_CONTACTS",
          "PETITIONS:SEND_ON_BEHALF",
          "PETITIONS:CHANGE_PATH",
          "PETITIONS:CREATE_TEMPLATES",
          "PETITIONS:LIST_PUBLIC_TEMPLATES",
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

    return userGroup;
  }
}
