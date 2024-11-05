import { inject, injectable } from "inversify";
import { isNonNullish, zip } from "remeda";
import { assert } from "ts-essentials";
import { ProfileType, ProfileTypeField, User, UserLocale } from "../db/__types";
import { IntegrationRepository } from "../db/repositories/IntegrationRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION } from "../integrations/profile-external-source/companies-house/CompaniesHouseProfileExternalSourceIntegration";
import { EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION } from "../integrations/profile-external-source/einforma/EInformaProfileExternalSourceIntegration";
import {
  IProfileExternalSourceIntegration,
  ProfileExternalSourceSearchParamDefinition,
  ProfileExternalSourceSearchResults,
  ProfileExternalSourceSearchSingleResult,
} from "../integrations/profile-external-source/ProfileExternalSourceIntegration";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import { validateProfileFieldValue } from "../util/validateProfileFieldValue";
import { ILogger, LOGGER } from "./Logger";

export const PROFILE_EXTERNAL_SOURCE_SERVICE = Symbol.for("PROFILE_EXTERNAL_SOURCE_SERVICE");

export interface IProfileExternalSourcesService {
  getAvailableProfileTypesByIntegrationId(integrationId: number): Promise<ProfileType[]>;
  getSearchParamsDefinition(
    integrationId: number,
    profileTypeId: number,
    userId: number,
    locale: UserLocale,
    profileId?: number | null,
  ): Promise<ProfileExternalSourceSearchParamDefinition[]>;
  entitySearch(
    integrationId: number,
    profileTypeId: number,
    locale: UserLocale,
    search: Record<string, string>,
    user: User,
  ): Promise<ProfileExternalSourceSearchResults>;
  entityDetails(
    integrationId: number,
    profileTypeId: number,
    externalId: string,
    user: User,
  ): Promise<ProfileExternalSourceSearchSingleResult>;
}

@injectable()
export class ProfileExternalSourcesService implements IProfileExternalSourcesService {
  private availableIntegrations: IProfileExternalSourceIntegration[] = [];

  constructor(
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(EINFORMA_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    eInformaIntegration: IProfileExternalSourceIntegration,
    @inject(COMPANIES_HOUSE_PROFILE_EXTERNAL_SOURCE_INTEGRATION)
    companiesHouseIntegration: IProfileExternalSourceIntegration,
    @inject(LOGGER) private logger: ILogger,
  ) {
    this.availableIntegrations = [eInformaIntegration, companiesHouseIntegration];
  }

  private async getIntegration(integrationId: number) {
    const integration = await this.integrations.loadIntegration(integrationId);
    assert(integration?.type === "PROFILE_EXTERNAL_SOURCE", "Invalid integration");

    // there will be only 1 integration of each provider per organization
    return {
      integration,
      provider: this.availableIntegrations.find((i) => i.PROVIDER_NAME === integration.provider),
    };
  }

  async getAvailableProfileTypesByIntegrationId(integrationId: number) {
    const { provider, integration } = await this.getIntegration(integrationId);
    const standardTypes = provider?.STANDARD_TYPES ?? [];

    if (standardTypes.length === 0) {
      return [];
    }

    return await this.profiles.getProfileTypesByStandardType(integration.org_id, standardTypes);
  }

  async getSearchParamsDefinition(
    integrationId: number,
    profileTypeId: number,
    userId: number,
    locale: UserLocale,
    profileId?: number | null,
  ): Promise<ProfileExternalSourceSearchParamDefinition[]> {
    const { provider } = await this.getIntegration(integrationId);
    assert(provider, "Invalid provider");

    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(isNonNullish(profileType?.standard_type), "Invalid profile type");

    const profileTypeFields =
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);
    const profileTypeFieldPermissions =
      await this.profiles.loadProfileTypeFieldUserEffectivePermission(
        profileTypeFields.map((ptf) => ({ profileTypeFieldId: ptf.id, userId })),
      );

    const profileValues = profileId
      ? await this.profiles.loadProfileFieldValuesByProfileId(profileId)
      : [];

    const userReadableProfileTypeFields = zip(profileTypeFields, profileTypeFieldPermissions)
      .filter(([, permission]) => isAtLeast(permission, "READ"))
      .map(([ptf]) => ptf);

    // reduce values to an object with the alias as key
    const defaultValues = profileValues.reduce((acc, value) => {
      const profileTypeField = userReadableProfileTypeFields.find(
        (f) => f.id === value.profile_type_field_id,
      );

      if (isNonNullish(profileTypeField?.alias)) {
        return { ...acc, [profileTypeField.alias]: value.content.value };
      }

      return acc;
    }, {});

    return await provider.getSearchParamsDefinition(
      profileType.standard_type,
      locale,
      defaultValues,
    );
  }

  private isPropertyCompatible(profileTypeFields: ProfileTypeField[]) {
    return (profileTypeFieldId: number, property: Pick<ProfileTypeField, "type" | "options">) => {
      const field = profileTypeFields.find((f) => f.id === profileTypeFieldId);
      if (!field) {
        this.logger.warn(`Field with id ${profileTypeFieldId} not found. Skipping...`);
        return false;
      }

      return (
        (field.type === "SELECT" &&
          property.type === "SELECT" &&
          field.options?.standardList === property.options?.standardList) ||
        field.type === property.type
      );
    };
  }

  private isValidContentById(profileTypeFields: ProfileTypeField[]) {
    return async (profileTypeFieldId: number, content: any) => {
      try {
        const field = profileTypeFields.find((f) => f.id === profileTypeFieldId);
        if (!field) {
          this.logger.info(`Field with id ${profileTypeFieldId} not found. Skipping...`);
          return false;
        }
        await validateProfileFieldValue(field, content);
        return true;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.info(
            `Invalid content for field ${JSON.stringify([profileTypeFieldId, content])}: ${error.message}. Skipping...`,
          );
        }
      }
      return false;
    };
  }

  private isValidContentByAlias(profileTypeFields: ProfileTypeField[]) {
    return async (alias: string, content: any) => {
      try {
        const field = profileTypeFields.find((f) => f.alias === alias);
        if (!field) {
          this.logger.warn(`Field with alias ${alias} not found. Skipping...`);
          return false;
        }
        await validateProfileFieldValue(field, content);
        return true;
      } catch (error) {
        if (error instanceof Error) {
          this.logger.warn(
            `Invalid content for field ${JSON.stringify([alias, content])}: ${error.message}. Skipping...`,
          );
        }
      }
      return false;
    };
  }

  async entitySearch(
    integrationId: number,
    profileTypeId: number,
    locale: UserLocale,
    search: Record<string, string>,
    user: User,
  ) {
    const { provider } = await this.getIntegration(integrationId);
    assert(provider, "Invalid provider");

    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(isNonNullish(profileType?.standard_type), "Invalid profile type");

    const profileTypeFields =
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);

    return await provider.entitySearch(
      integrationId,
      profileType.standard_type,
      locale,
      search,
      async (data) =>
        await this.profiles.createProfileExternalSourceEntity(
          {
            integration_id: integrationId,
            created_by_user_id: user.id,
            standard_type: profileType.standard_type!,
            data,
            parsed_data: {
              ...(await provider.buildProfileTypeFieldValueContentsByAlias(
                profileType.standard_type!,
                data,
                this.isValidContentByAlias(profileTypeFields),
              )),
              ...(await provider.buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId(
                integrationId,
                profileTypeId,
                profileType.standard_type!,
                data,
                this.isPropertyCompatible(profileTypeFields),
                this.isValidContentById(profileTypeFields),
              )),
            },
          },
          `User:${user.id}`,
        ),
    );
  }

  async entityDetails(
    integrationId: number,
    profileTypeId: number,
    externalId: string,
    user: User,
  ) {
    const { provider } = await this.getIntegration(integrationId);
    assert(provider, "Invalid provider");

    const profileType = await this.profiles.loadProfileType(profileTypeId);
    assert(isNonNullish(profileType?.standard_type), "Invalid profile type");

    const profileTypeFields =
      await this.profiles.loadProfileTypeFieldsByProfileTypeId(profileTypeId);

    return await provider.entityDetails(
      integrationId,
      profileType.standard_type!,
      externalId,
      async (data) =>
        await this.profiles.createProfileExternalSourceEntity(
          {
            integration_id: integrationId,
            created_by_user_id: user.id,
            standard_type: profileType.standard_type!,
            data,
            parsed_data: {
              ...(await provider.buildProfileTypeFieldValueContentsByAlias(
                profileType.standard_type!,
                data,
                this.isValidContentByAlias(profileTypeFields),
              )),
              ...(await provider.buildCustomProfileTypeFieldValueContentsByProfileTypeFieldId(
                integrationId,
                profileTypeId,
                profileType.standard_type!,
                data,
                this.isPropertyCompatible(profileTypeFields),
                this.isValidContentById(profileTypeFields),
              )),
            },
          },
          `User:${user.id}`,
        ),
    );
  }
}
