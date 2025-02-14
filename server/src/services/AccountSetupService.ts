import { inject, injectable } from "inversify";
import pMap from "p-map";
import { isNonNullish } from "remeda";
import { CONFIG, Config } from "../config";
import {
  CreateOrganization,
  CreateUser,
  CreateUserData,
  ListViewType,
  Organization,
  User,
  UserGroupPermissionName,
  UserLocale,
} from "../db/__types";
import { OrganizationRepository } from "../db/repositories/OrganizationRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { UserGroupRepository } from "../db/repositories/UserGroupRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { ViewRepository } from "../db/repositories/ViewRepository";
import { I18N_SERVICE, II18nService } from "./I18nService";
import { IIntegrationsSetupService, INTEGRATIONS_SETUP_SERVICE } from "./IntegrationsSetupService";
import { IOrgLimitsService, ORG_LIMITS_SERVICE } from "./OrgLimitsService";
import { IProfilesSetupService, PROFILES_SETUP_SERVICE } from "./ProfilesSetupService";

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
    @inject(ViewRepository) private views: ViewRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
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

    await this.createDefaultPetitionListViewsForUser(user, userData.preferred_locale);
    await this.createDefaultProfileListViewsForUser(user);
    await this.pinProfileTypesForUser(user);

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
    await this.profilesSetup.createDefaultProfileTypes(organization.id, createdBy);
    await this.profilesSetup.createDefaultProfileRelationshipTypes(organization.id, createdBy);
    await this.integrationsSetup.createSignaturitIntegration(
      {
        name: "Signaturit Sandbox",
        org_id: organization.id,
        is_default: true,
      },
      this.config.signature.signaturitSandboxApiKey,
      "sandbox",
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

  private async createDefaultPetitionListViewsForUser(user: User, locale: UserLocale) {
    const intl = await this.intl.getIntl(locale);
    const defaultPetitionViewData = {
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
          ["ALL", { ...defaultPetitionViewData }, "ALL"],
          [
            intl.formatMessage({
              id: "default-petition-list-views.ongoing",
              defaultMessage: "Ongoing",
            }),
            { ...defaultPetitionViewData, status: ["COMPLETED", "PENDING"] },
            "CUSTOM",
          ],
          [
            intl.formatMessage({
              id: "default-petition-list-views.closed",
              defaultMessage: "Closed",
            }),
            { ...defaultPetitionViewData, status: ["CLOSED"] },
            "CUSTOM",
          ],
          [
            intl.formatMessage({
              id: "default-petition-list-views.draft",
              defaultMessage: "Draft",
            }),
            { ...defaultPetitionViewData, status: ["DRAFT"] },
            "CUSTOM",
          ],
        ] as [string, any, ListViewType][]
      ).map(([name, data, viewType], index) => ({
        user_id: user.id,
        name,
        data,
        position: index,
        is_default: false,
        view_type: viewType,
        updated_by: `User:${user.id}`,
      })),
      `User:${user.id}`,
    );
  }

  private async createDefaultProfileListViewsForUser(user: User) {
    const profileTypes = await this.profiles.loadProfileTypesByOrgId(user.org_id);

    const columnsByStandardType = Object.fromEntries(
      (
        await pMap(
          profileTypes,
          async (profileType) => {
            const fields = await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileType.id);
            if (
              profileType.standard_type === "INDIVIDUAL" ||
              profileType.standard_type === "LEGAL_ENTITY"
            ) {
              return [
                profileType.standard_type,
                ["p_client_status", "p_risk", "p_relationship"]
                  .map((alias) => `field_${fields.find((f) => f.alias === alias)!.id}`)
                  .concat("subscribers", "createdAt"),
              ];
            } else if (profileType.standard_type === "CONTRACT") {
              return [
                profileType.standard_type,
                ["p_signature_date", "p_expiration_date"]
                  .map((alias) => `field_${fields.find((f) => f.alias === alias)!.id}`)
                  .concat("subscribers", "createdAt"),
              ];
            } else {
              return null;
            }
          },
          { concurrency: 1 },
        )
      ).filter(isNonNullish),
    );

    await this.views.createProfileListView(
      profileTypes.map((profileType) => ({
        profile_type_id: profileType.id,
        user_id: user.id,
        name: "ALL",
        data: {
          columns: profileType.standard_type
            ? columnsByStandardType[profileType.standard_type]
            : null,
          search: null,
          sort: null,
          status: null,
        },
        position: 0,
        is_default: false,
        view_type: "ALL",
      })),
      `User:${user.id}`,
    );
  }

  private async pinProfileTypesForUser(user: User) {
    const profileTypes = await this.profiles.loadProfileTypesByOrgId(user.org_id);
    const legalEntity = profileTypes.find((pt) => pt.standard_type === "LEGAL_ENTITY");
    const individual = profileTypes.find((pt) => pt.standard_type === "INDIVIDUAL");

    if (legalEntity) {
      await this.profiles.pinProfileType(legalEntity.id, user.id);
    }
    if (individual) {
      await this.profiles.pinProfileType(individual.id, user.id);
    }
  }
}
